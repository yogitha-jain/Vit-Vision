"""
VetVision inference: loads the trained models and predicts from an image.

- Disease models (dog, cat, cattle): PyTorch EfficientNet-V2-S (.pth files).
- Breed model (all 30 breeds):       TensorFlow/Keras EfficientNetV2-B0 (.keras).

Models are loaded the first time they are needed, then kept in memory.
"""
from pathlib import Path
import json

import numpy as np
from PIL import Image, UnidentifiedImageError

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"

# Change a filename here if yours is different.
DISEASE_FILES = {
    "dog": "dog_effnetv2s_best.pth",
    "cat": "cat_effnetv2s_v2_best.pth",
    "cattle": "cow_effnetv2s_best.pth",
}
BREED_MODEL_FILE = "final_hierarchical_model.keras"
LABEL_MAPS_FILE = "label_maps.json"

BREED_IMG_SIZE = (224, 224)          # same as training
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
LOW_CONFIDENCE = 0.50                # below this, the result is flagged as uncertain

ANIMAL_ALIASES = {
    "dog": "dog", "cat": "cat",
    "cattle": "cattle", "cow": "cattle", "buffalo": "cattle", "bovine": "cattle",
}

_cache = {}


def normalize_animal(value):
    animal = ANIMAL_ALIASES.get(str(value or "").strip().lower())
    if animal is None:
        raise ValueError("animal must be one of: dog, cat, cattle.")
    return animal


def read_image(file_stream):
    """Open an uploaded file as an RGB image."""
    try:
        return Image.open(file_stream).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise ValueError("Could not read the image. Upload a JPG or PNG photo.")


def _top3(labels, probs):
    order = np.argsort(probs)[::-1][:3]
    return [{"label": labels[i], "confidence": round(float(probs[i]), 4)} for i in order]


def pretty(name):
    return str(name).replace("_", " ").replace("-", " ").strip().title()


def models_status():
    """Which model files are present in backend/models."""
    files = {f"disease_{a}": f for a, f in DISEASE_FILES.items()}
    files["breed_model"] = BREED_MODEL_FILE
    files["breed_labels"] = LABEL_MAPS_FILE
    status = {}
    for key, fname in files.items():
        path = MODELS_DIR / fname
        status[key] = {
            "file": fname,
            "found": path.is_file() and path.stat().st_size > 0,
        }
    return status


# ---------------------------------------------------------------- disease
def _load_disease(animal):
    key = ("disease", animal)
    if key in _cache:
        return _cache[key]

    path = MODELS_DIR / DISEASE_FILES[animal]
    if not path.is_file() or path.stat().st_size == 0:
        raise FileNotFoundError(f"Model file missing or empty: models/{DISEASE_FILES[animal]}")

    import torch
    import torch.nn as nn
    from torchvision import models, transforms as T

    ckpt = torch.load(path, map_location="cpu", weights_only=False)
    classes = list(ckpt["classes"])
    img = int(ckpt.get("img", 288))

    net = models.efficientnet_v2_s(weights=None)
    net.classifier = nn.Sequential(nn.Dropout(0.4), nn.Linear(1280, len(classes)))
    net.load_state_dict(ckpt["state_dict"])
    net.eval()

    tf = T.Compose([T.Resize((img, img)), T.ToTensor(),
                    T.Normalize(IMAGENET_MEAN, IMAGENET_STD)])
    _cache[key] = (net, classes, tf)
    return _cache[key]


def predict_disease(animal, image):
    net, classes, tf = _load_disease(animal)
    import torch
    x = tf(image).unsqueeze(0)
    with torch.no_grad():
        probs = torch.softmax(net(x), dim=1)[0].numpy()
    best = int(np.argmax(probs))
    conf = float(probs[best])
    return {
        "animal": animal,
        "disease": classes[best],
        "confidence": round(conf, 4),
        "low_confidence": conf < LOW_CONFIDENCE,
        "top3": _top3(classes, probs),
    }


# ------------------------------------------------------------------ breed
def _load_breed():
    if "breed" in _cache:
        return _cache["breed"]

    model_path = MODELS_DIR / BREED_MODEL_FILE
    labels_path = MODELS_DIR / LABEL_MAPS_FILE
    for p in (model_path, labels_path):
        if not p.is_file() or p.stat().st_size == 0:
            raise FileNotFoundError(f"Model file missing or empty: models/{p.name}")

    import tensorflow as tf
    # compile=False: we only predict, so the custom training loss isn't needed.
    model = tf.keras.models.load_model(model_path, compile=False)
    with open(labels_path, "r", encoding="utf-8") as f:
        names = json.load(f)["global_breed_names"]      # e.g. "dog/golden_retriever"
    _cache["breed"] = (model, names)
    return _cache["breed"]


def predict_breed(animal, image):
    model, names = _load_breed()

    # The model does its own scaling, so give it raw 0-255 pixels (do NOT divide by 255).
    arr = np.asarray(image.resize(BREED_IMG_SIZE, Image.BILINEAR), dtype=np.float32)[None]
    probs = np.asarray(model.predict(arr, verbose=0))[0]
    if len(probs) != len(names):
        raise ValueError("Breed model output does not match label_maps.json.")

    model_animal = names[int(np.argmax(probs))].split("/", 1)[0]

    # Only allow breeds of the animal the user selected.
    mask = np.array([n.split("/", 1)[0] == animal for n in names], dtype=np.float32)
    if mask.sum() == 0:
        raise ValueError(f"No breeds for '{animal}' in label_maps.json.")
    masked = probs * mask
    masked = masked / masked.sum()

    best = int(np.argmax(masked))
    raw = names[best].split("/", 1)[1]
    conf = float(masked[best])
    labels = [n.split("/", 1)[1] for n in names]
    return {
        "animal": animal,
        "breed": raw,
        "breed_display": pretty(raw),
        "confidence": round(conf, 4),
        "low_confidence": conf < LOW_CONFIDENCE,
        "animal_mismatch": model_animal != animal,   # photo may not be the selected animal
        "model_thinks_animal": model_animal,
        "top3": _top3(labels, masked),
    }