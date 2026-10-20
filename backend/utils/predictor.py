"""
AnimalCareAI - Prediction Utilities

This module connects trained breed-age and disease models
to the application.

The models must be trained and saved before predictions
can be made.
"""

from pathlib import Path
import json

import numpy as np
from PIL import Image

try:
    from tensorflow.keras.models import load_model
except ImportError:
    load_model = None


PROJECT_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = PROJECT_DIR / "models"

IMAGE_SIZE = (224, 224)

# These filenames can be changed to match your trained models.
BREED_AGE_MODEL_PATH = MODELS_DIR / "breed_age_model.keras"
DISEASE_MODEL_PATH = MODELS_DIR / "disease_model.keras"

BREED_CLASSES_PATH = MODELS_DIR / "breed_classes.json"
AGE_CLASSES_PATH = MODELS_DIR / "age_classes.json"
DISEASE_CLASSES_PATH = MODELS_DIR / "disease_classes.json"


def load_class_names(file_path):
    """Load class names from a JSON file."""
    if not file_path.exists():
        raise FileNotFoundError(
            f"Class names file not found: {file_path}"
        )

    with open(file_path, "r", encoding="utf-8") as file:
        classes = json.load(file)

    if isinstance(classes, dict):
        # Handles mappings such as {"0": "Beagle", "1": "Boxer"}.
        try:
            return [
                str(classes[key])
                for key in sorted(classes, key=lambda k: int(k))
            ]
        except (ValueError, TypeError):
            raise ValueError(
                f"Expected numeric class-index keys in {file_path}"
            )

    if isinstance(classes, list):
        return [str(name) for name in classes]

    raise ValueError(
        f"{file_path} must contain a JSON list or indexed dictionary."
    )


def prepare_image(image_path):
    """Convert an image to the model's expected input shape."""
    image_path = Path(image_path)

    if not image_path.is_file():
        raise FileNotFoundError(
            f"Image file not found: {image_path}"
        )

    with Image.open(image_path) as image:
        image = image.convert("RGB")
        image = image.resize(IMAGE_SIZE)
        array = np.asarray(image, dtype=np.float32)

    # Assumes the trained model expects pixel values from 0 to 1.
    array = array / 255.0

    return np.expand_dims(array, axis=0)


def load_trained_model(model_path):
    """Load a saved Keras model."""
    if load_model is None:
        raise ImportError(
            "TensorFlow is not installed. Install it in your "
            "project's Python environment before loading models."
        )

    if not model_path.is_file():
        raise FileNotFoundError(
            f"Trained model not found: {model_path}"
        )

    return load_model(model_path)


def predict_class(model, image_array, class_names):
    """Return the class with the highest model score."""
    predictions = np.asarray(
        model.predict(image_array, verbose=0)
    )

    if predictions.ndim != 2 or predictions.shape[0] != 1:
        raise ValueError(
            "Expected one image and a model output shaped (1, classes)."
        )

    scores = predictions[0]

    if len(scores) != len(class_names):
        raise ValueError(
            "Model output count does not match the class names file. "
            "Check that the class list matches the model used for training."
        )

    predicted_index = int(np.argmax(scores))

    return {
        "label": class_names[predicted_index],
        "confidence": float(scores[predicted_index]),
    }


def predict_breed_age(image_path):
    """
    Predict breed and age group.

    This assumes the breed-age model has two outputs:
    breed scores first, age-group scores second.
    """
    model = load_trained_model(BREED_AGE_MODEL_PATH)
    breed_classes = load_class_names(BREED_CLASSES_PATH)
    age_classes = load_class_names(AGE_CLASSES_PATH)
    image_array = prepare_image(image_path)

    outputs = model.predict(image_array, verbose=0)

    if not isinstance(outputs, (list, tuple)) or len(outputs) != 2:
        raise ValueError(
            "The breed-age model must have two outputs: "
            "breed scores and age-group scores. If your model has "
            "a different architecture, this function must be adjusted."
        )

    breed_scores = np.asarray(outputs[0]).reshape(1, -1)
    age_scores = np.asarray(outputs[1]).reshape(1, -1)

    breed_result = predict_class(
        _ArrayPredictionModel(breed_scores),
        np.empty((1,)),
        breed_classes,
    )

    age_result = predict_class(
        _ArrayPredictionModel(age_scores),
        np.empty((1,)),
        age_classes,
    )

    return {
        "breed": breed_result["label"],
        "breed_confidence": breed_result["confidence"],
        "age_group": age_result["label"],
        "age_confidence": age_result["confidence"],
    }


class _ArrayPredictionModel:
    """Internal helper for selecting a class from existing scores."""

    def __init__(self, scores):
        self.scores = scores

    def predict(self, _image_array, verbose=0):
        return self.scores


def predict_disease(image_path):
    """Predict the disease class from a trained disease model."""
    model = load_trained_model(DISEASE_MODEL_PATH)
    disease_classes = load_class_names(DISEASE_CLASSES_PATH)
    image_array = prepare_image(image_path)

    return predict_class(
        model,
        image_array,
        disease_classes,
    )
