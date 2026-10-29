"""
VetVision history: each logged-in user's saved results.

Collection "history". Every entry belongs to one user (userId) and the
routes below only ever touch the logged-in user's own entries.
An entry can optionally be linked to one of the user's pets (petId).
"""
import json
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request

from auth import login_required, _fail
from database.database import get_collection
from utils import inference

history_bp = Blueprint("history", __name__)

MAX_PAGE = 100
MAX_RECOMMENDATION_BYTES = 20_000
MAX_IMAGE_CHARS = 200_000
MAX_RESULT_BYTES = 20_000


def history():
    return get_collection("history")


def ensure_history_indexes():
    history().create_index([("userId", 1), ("createdAt", -1)])


def _text(value, limit):
    return str(value or "").strip()[:limit]


def _number(value):
    try:
        return round(float(value), 4)
    except (TypeError, ValueError):
        return None


def _public_entry(doc):
    return {
        "id": str(doc["_id"]),
        "animal": doc["animal"],
        "disease": doc.get("disease", ""),
        "diseaseConfidence": doc.get("diseaseConfidence"),
        "breed": doc.get("breed", ""),
        "breedConfidence": doc.get("breedConfidence"),
        "ageGroup": doc.get("ageGroup", ""),
        "imageName": doc.get("imageName", ""),
        "type": doc.get("type", ""),
        "imageUrl": doc.get("imageUrl", ""),
        "result": doc.get("result"),
        "recommendations": doc.get("recommendations"),
        "petId": str(doc["petId"]) if doc.get("petId") else "",
        "createdAt": doc["createdAt"].strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@history_bp.post("/api/history")
@login_required
def add_history(user):
    data = request.get_json(silent=True) or {}
    try:
        animal = inference.normalize_animal(data.get("animal"))
    except ValueError as e:
        return _fail(str(e), 400)

    recommendations = data.get("recommendations")
    if recommendations is not None:
        if not isinstance(recommendations, (dict, list)):
            return _fail("recommendations must be an object or a list.", 400)
        if len(json.dumps(recommendations)) > MAX_RECOMMENDATION_BYTES:
            return _fail("recommendations is too large.", 400)

    entry_type = str(data.get("type", "")).lower()
    if entry_type not in ("breed", "disease"):
        return _fail("type must be 'breed' or 'disease'.", 400)

    image_url = data.get("imageUrl") or ""
    if not isinstance(image_url, str) or len(image_url) > MAX_IMAGE_CHARS \
            or (image_url and not image_url.startswith("data:image/")):
        return _fail("imageUrl is invalid or too large.", 400)

    result = data.get("result")
    if result is not None and (not isinstance(result, dict)
                               or len(json.dumps(result)) > MAX_RESULT_BYTES):
        return _fail("result is invalid or too large.", 400)

    # Optional: link this scan to one of the user's own pets.
    pet_oid = None
    pet_id = data.get("petId")
    if pet_id:
        try:
            pet_oid = ObjectId(str(pet_id))
        except InvalidId:
            return _fail("Invalid petId.", 400)
        owned = get_collection("pets").find_one(
            {"_id": pet_oid, "userId": user["_id"]})
        if owned is None:
            return _fail("Pet not found.", 404)

    doc = {
        "userId": user["_id"],
        "animal": animal,
        "disease": _text(data.get("disease"), 100),
        "diseaseConfidence": _number(data.get("diseaseConfidence")),
        "breed": _text(data.get("breed"), 100),
        "breedConfidence": _number(data.get("breedConfidence")),
        "ageGroup": _text(data.get("ageGroup"), 20),
        "imageName": _text(data.get("imageName"), 200),
        "type": entry_type,
        "imageUrl": image_url,
        "result": result,
        "recommendations": recommendations,
        "createdAt": datetime.now(timezone.utc),
    }
    if pet_oid is not None:
        doc["petId"] = pet_oid

    history().insert_one(doc)
    return jsonify({"message": "Saved to history.", "entry": _public_entry(doc)}), 201


@history_bp.get("/api/history")
@login_required
def list_history(user):
    try:
        limit = min(max(int(request.args.get("limit", 50)), 1), MAX_PAGE)
        skip = max(int(request.args.get("skip", 0)), 0)
    except ValueError:
        return _fail("limit and skip must be numbers.", 400)

    query = {"userId": user["_id"]}

    # Optional: only the scans linked to one pet.
    pet_id = request.args.get("petId")
    if pet_id:
        try:
            query["petId"] = ObjectId(pet_id)
        except InvalidId:
            return _fail("Invalid petId.", 400)

    cursor = history().find(query).sort("createdAt", -1).skip(skip).limit(limit)
    return jsonify({
        "total": history().count_documents(query),
        "entries": [_public_entry(d) for d in cursor],
    })


@history_bp.delete("/api/history/<entry_id>")
@login_required
def delete_history(user, entry_id):
    try:
        oid = ObjectId(entry_id)
    except InvalidId:
        return _fail("Invalid history id.", 400)
    result = history().delete_one({"_id": oid, "userId": user["_id"]})
    if result.deleted_count == 0:
        return _fail("History entry not found.", 404)
    return jsonify({"message": "Deleted."})