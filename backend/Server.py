"""
VetVision backend API.
Run from the project root:   python backend/server.py
"""
from flask import Flask, request, jsonify
from flask_cors import CORS

from utils import inference
from utils.care_recommendation import get_recommendations

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024    # 10 MB upload limit
CORS(app)                                              # lets the frontend (another port) call this API


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
    return jsonify({"error": message}), status


def _image_and_animal():
    file = request.files.get("image")
    if file is None:
        raise ValueError("No image uploaded. Send the photo in a form field named 'image'.")
    animal = inference.normalize_animal(request.form.get("animal"))
    return inference.read_image(file.stream), animal


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "models": inference.models_status()})


@app.post("/api/detect-disease")
def detect_disease():
    try:
        image, animal = _image_and_animal()
        return jsonify(inference.predict_disease(animal, image))
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


@app.errorhandler(413)
def too_large(_):
    return _error("Image is too large (limit 10 MB).", 413)


if __name__ == "__main__":
    # debug=False on purpose: the auto-reloader would load the models twice.
    app.run(host="127.0.0.1", port=5000, debug=False)