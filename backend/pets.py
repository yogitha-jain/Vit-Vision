"""
VetVision pets: each logged-in user's pet profiles.

Collection "pets". Every pet belongs to one user (userId) and the routes
below only ever touch the logged-in user's own pets.
"""
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request

from auth import login_required, _fail
from database.database import get_collection
from utils import inference

pets_bp = Blueprint("pets", __name__)

MAX_PETS = 20
MAX_IMAGE_CHARS = 200_000
AGE_GROUPS = ("", "young", "adult", "senior")


def pets():
    return get_collection("pets")


def ensure_pets_indexes():
    pets().create_index([("userId", 1), ("createdAt", -1)])


def _text(value, limit):
    return str(value or "").strip()[:limit]


def _public_pet(doc):
    history = get_collection("history")
    query = {"userId": doc["userId"], "petId": doc["_id"]}
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "animal": doc["animal"],
        "breed": doc.get("breed", ""),
        "ageGroup": doc.get("ageGroup", ""),
        "photo": doc.get("photo", ""),
        "scanCount": history.count_documents(query),
        "createdAt": doc["createdAt"].strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@pets_bp.post("/api/pets")
@login_required
def add_pet(user):
    data = request.get_json(silent=True) or {}

    name = _text(data.get("name"), 60)
    if not name:
        return _fail("Please enter your pet's name.", 400)

    try:
        animal = inference.normalize_animal(data.get("animal"))
    except ValueError as e:
        return _fail(str(e), 400)

    age_group = str(data.get("ageGroup") or "").strip().lower()
    if age_group not in AGE_GROUPS:
        return _fail("ageGroup must be young, adult or senior.", 400)

    photo = data.get("photo") or ""
    if not isinstance(photo, str) or len(photo) > MAX_IMAGE_CHARS \
            or (photo and not photo.startswith("data:image/")):
        return _fail("photo is invalid or too large.", 400)

    if pets().count_documents({"userId": user["_id"]}) >= MAX_PETS:
        return _fail(f"You can save up to {MAX_PETS} pets.", 400)

    doc = {
        "userId": user["_id"],
        "name": name,
        "animal": animal,
        "breed": _text(data.get("breed"), 100),
        "ageGroup": age_group,
        "photo": photo,
        "createdAt": datetime.now(timezone.utc),
    }
    pets().insert_one(doc)
    return jsonify({"message": "Pet added.", "pet": _public_pet(doc)}), 201


@pets_bp.get("/api/pets")
@login_required
def list_pets(user):
    cursor = pets().find({"userId": user["_id"]}).sort("createdAt", -1)
    return jsonify({"pets": [_public_pet(d) for d in cursor]})


@pets_bp.delete("/api/pets/<pet_id>")
@login_required
def delete_pet(user, pet_id):
    try:
        oid = ObjectId(pet_id)
    except InvalidId:
        return _fail("Invalid pet id.", 400)

    result = pets().delete_one({"_id": oid, "userId": user["_id"]})
    if result.deleted_count == 0:
        return _fail("Pet not found.", 404)

    # Keep the scans, just unlink them from the deleted pet.
    get_collection("history").update_many(
        {"userId": user["_id"], "petId": oid},
        {"$unset": {"petId": ""}},
    )
    return jsonify({"message": "Pet deleted."})