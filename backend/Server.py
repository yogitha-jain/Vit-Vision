"""
VetVision backend API.
Run from the project root:   python backend/server.py
"""
import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv
from animal_check import is_expected_animal
from PIL import Image

# Read backend/.env BEFORE importing anything that uses MONGO_URI.
load_dotenv(Path(__file__).resolve().parent / ".env")

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo.errors import PyMongoError

from auth import auth_bp, ensure_indexes
from history import history_bp, ensure_history_indexes
from pets import pets_bp, ensure_pets_indexes
from database.database import check_database_connection
from utils import inference
from utils.care_recommendation import get_recommendations

SECRET_KEY = os.getenv("SECRET_KEY", "")
if len(SECRET_KEY) < 16:
    raise RuntimeError(
        "SECRET_KEY is missing or too short. Copy backend/.env.example to "
        "backend/.env and fill in the values.")

FRONTEND_ORIGINS = [
    o.strip() for o in os.getenv(
        "FRONTEND_ORIGINS", "http://127.0.0.1:5500,http://localhost:5500"
    ).split(",") if o.strip()
]

app = Flask(__name__)
app.config.update(
    SECRET_KEY=SECRET_KEY,
    MAX_CONTENT_LENGTH=10 * 1024 * 1024,                 # 10 MB upload limit
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE=os.getenv("COOKIE_SAMESITE", "Lax"),
    SESSION_COOKIE_SECURE=os.getenv("COOKIE_SECURE", "0") == "1",
    PERMANENT_SESSION_LIFETIME=timedelta(days=7),
)
# Only the frontend's own address may call the API with login cookies.
CORS(app, supports_credentials=True, origins=FRONTEND_ORIGINS)
app.register_blueprint(auth_bp)
app.register_blueprint(history_bp)
app.register_blueprint(pets_bp)

# (young if younger than, senior if at least) in years. Rough rules of thumb: edit to taste.
AGE_RULES = {"dog": (1, 8), "cat": (1, 10), "cattle": (2, 12)}


def age_to_group(animal, age, unit):
    try:
        years = float(age)
    except (TypeError, ValueError):
        raise ValueError("age must be a number.")
    if years < 0:
        raise ValueError("age cannot be negative.")
    if str(unit or "years").lower().startswith("month"):
        years /= 12
    young_below, senior_from = AGE_RULES[animal]
    if years < young_below:
        return "young"
    if years >= senior_from:
        return "senior"
    return "adult"


def _error(message, status):
    # "error" is read by the detection pages, "message" by the settings page.
    return jsonify({"error": message, "message": message}), status


class NotRecognized(Exception):
    """Raised when the uploaded image is not the selected animal."""


def _image_and_animal():
    file = request.files.get("image")
    if file is None:
        raise ValueError("No image uploaded. Send the photo in a form field named 'image'.")
    animal = inference.normalize_animal(request.form.get("animal"))

    # CLIP check: is this really the selected animal?
    clip_image = Image.open(file.stream).convert("RGB")
    if not is_expected_animal(clip_image, animal):
        raise NotRecognized(
            "Could not recognise this image. Please upload a clear photo of the selected animal.")
    file.stream.seek(0)   # rewind so the breed/disease model can read the file again

    return inference.read_image(file.stream), animal


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "models": inference.models_status(),
        "database": check_database_connection(),
    })


@app.post("/api/detect-disease")
def detect_disease():
    try:
        image, animal = _image_and_animal()
        return jsonify(inference.predict_disease(animal, image))
    except NotRecognized as e:
        return _error(str(e), 422)
    except ValueError as e:
        return _error(str(e), 400)
    except FileNotFoundError as e:
        return _error(str(e), 503)
    except Exception as e:
        return _error(f"Disease prediction failed: {e}", 500)


@app.post("/api/detect-breed")
def detect_breed():
    try:
        image, animal = _image_and_animal()
        return jsonify(inference.predict_breed(animal, image))
    except NotRecognized as e:
        return _error(str(e), 422)
    except ValueError as e:
        return _error(str(e), 400)
    except FileNotFoundError as e:
        return _error(str(e), 503)
    except Exception as e:
        return _error(f"Breed prediction failed: {e}", 500)


@app.post("/api/recommend")
def recommend():
    data = request.get_json(silent=True) or {}
    try:
        animal = inference.normalize_animal(data.get("animal"))
        if not str(data.get("breed", "")).strip():
            raise ValueError("breed is required.")
        age_group = data.get("age_group")
        if not age_group:
            has_age = data.get("age") not in (None, "")
            age_group = (age_to_group(animal, data["age"], data.get("age_unit"))
                         if has_age else "adult")
        result = get_recommendations(
            animal_type=animal,
            breed=data["breed"],
            age_group=age_group,
            detected_disease=data.get("disease") or "Healthy",
        )
        return jsonify(result)
    except ValueError as e:
        return _error(str(e), 400)
    except Exception as e:
        return _error(f"Recommendation failed: {e}", 500)


@app.errorhandler(PyMongoError)
def database_unreachable(_):
    return _error("The database is not reachable right now. Try again shortly.", 503)


@app.errorhandler(413)
def too_large(_):
    return _error("Image is too large (limit 10 MB).", 413)


try:
    ensure_indexes()
    ensure_history_indexes()
    ensure_pets_indexes()
except Exception as e:
    print("WARNING: could not reach MongoDB, accounts will not work until it is fixed:", e)


if __name__ == "__main__":
    # debug=False on purpose: the auto-reloader would load the models twice.
    app.run(host="127.0.0.1", port=5000, debug=False)