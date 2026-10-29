import torch
from transformers import CLIPModel, CLIPProcessor

# Loaded once when the server starts
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").eval()
clip_proc = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

LABELS = {
    "dog": "a photo of a dog",
    "cat": "a photo of a cat",
    "cow": "a photo of a cow",
    "person": "a photo of a person",
    "other": "a photo of something else",
}
ALIASES = {"cattle": "cow"}

def is_expected_animal(image, animal):
    animal = ALIASES.get(animal.lower(), animal.lower())
    if animal not in LABELS:
        return False
    keys = list(LABELS)
    inputs = clip_proc(text=list(LABELS.values()), images=image,
                       return_tensors="pt", padding=True)
    with torch.no_grad():
        probs = clip_model(**inputs).logits_per_image.softmax(dim=1)[0]
    return keys[probs.argmax().item()] == animal