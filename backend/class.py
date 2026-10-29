import json
import torch
from pathlib import Path

M = Path("backend/models")
files = {
    "dog": "dog_effnetv2s_best.pth",
    "cat": "cat_effnetv2s_v2_best.pth",
    "cattle": "cow_effnetv2s_best.pth",
}
for animal, f in files.items():
    ck = torch.load(M / f, map_location="cpu", weights_only=False)
    print(animal, "DISEASES:", list(ck["classes"]))

with open(M / "label_maps.json", encoding="utf-8") as fh:
    print("BREEDS:", json.load(fh)["global_breed_names"])