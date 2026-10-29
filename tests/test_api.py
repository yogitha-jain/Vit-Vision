"""
VitVision backend API unit tests.

Supported locations:
1. project_root/tests/test_api.py
2. project_root/backend/tests/test_api.py

Run from project root:
    python -m pytest tests/test_api.py -v

Or, if this file is in backend/tests:
    cd backend
    python -m pytest tests/test_api.py -v

These tests mock ML prediction functions. They test API behaviour, not model accuracy.
"""

import io
import sys
from pathlib import Path

import pytest
from PIL import Image


# Find Server.py in either the backend folder or the current project folder.
TEST_DIR = Path(__file__).resolve().parent
PROJECT_DIR = TEST_DIR.parent

candidate_dirs = [
    PROJECT_DIR / "backend",  # tests/ at project root
    PROJECT_DIR,              # tests/ inside backend
    Path.cwd() / "backend",
    Path.cwd(),
]

for directory in candidate_dirs:
    if (directory / "Server.py").is_file():
        sys.path.insert(0, str(directory))
        break
else:
    raise ModuleNotFoundError(
        "Could not locate Server.py. Put this file in project_root/tests "
        "or project_root/backend/tests and confirm backend/Server.py exists."
    )

import Server  # noqa: E402


@pytest.fixture
def client():
    """Create a Flask test client without starting a live server."""
    Server.app.config.update(TESTING=True)
    with Server.app.test_client() as test_client:
        yield test_client


@pytest.fixture
def png_bytes():
    """Create a small valid PNG image in memory."""
    image = Image.new("RGB", (100, 100), color=(80, 150, 100))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture
def uploaded_png(png_bytes):
    """Return a fresh upload stream for each request."""
    return io.BytesIO(png_bytes)


# 1. Health endpoint
def test_health_api(client, monkeypatch):
    monkeypatch.setattr(Server.inference, "models_status", lambda: {})
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.is_json
    assert response.get_json()["status"] == "ok"


# 2. Animal name normalization
@pytest.mark.parametrize(
    ("animal", "expected"),
    [
        ("dog", "dog"),
        ("cat", "cat"),
        ("cattle", "cattle"),
        ("cow", "cattle"),
        ("buffalo", "cattle"),
        ("bovine", "cattle"),
    ],
)
def test_normalize_animal(animal, expected):
    assert Server.inference.normalize_animal(animal) == expected


# 3. Invalid animal normalization
def test_normalize_invalid_animal():
    with pytest.raises((ValueError, KeyError)):
        Server.inference.normalize_animal("horse")


# 4. Disease endpoint requires an image
def test_disease_missing_image(client):
    response = client.post(
        "/api/detect-disease",
        data={"animal": "dog"},
    )

    assert response.status_code == 400
    assert "No image uploaded" in response.get_json()["error"]


# 5. Breed endpoint requires an image
def test_breed_missing_image(client):
    response = client.post(
        "/api/detect-breed",
        data={"animal": "cat"},
    )

    assert response.status_code == 400
    assert "No image uploaded" in response.get_json()["error"]


# 6. Reject unsupported animal in disease endpoint
def test_disease_rejects_invalid_animal(client, png_bytes):
    response = client.post(
        "/api/detect-disease",
        data={
            "animal": "horse",
            "image": (io.BytesIO(png_bytes), "animal.png"),
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


# 7. Reject unsupported animal in breed endpoint
def test_breed_rejects_invalid_animal(client, png_bytes):
    response = client.post(
        "/api/detect-breed",
        data={
            "animal": "horse",
            "image": (io.BytesIO(png_bytes), "animal.png"),
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


# 8. Reject unreadable image
def test_disease_rejects_invalid_image(client):
    response = client.post(
        "/api/detect-disease",
        data={
            "animal": "dog",
            "image": (io.BytesIO(b"not a valid image"), "bad.png"),
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


# 9. Disease prediction response (ML function mocked)
def test_disease_prediction_api(client, png_bytes, monkeypatch):
    expected = {
        "animal": "dog",
        "disease": "Healthy",
        "confidence": 0.97,
    }
    monkeypatch.setattr(
        Server.inference,
        "predict_disease",
        lambda animal, image: expected,
    )

    response = client.post(
        "/api/detect-disease",
        data={
            "animal": "dog",
            "image": (io.BytesIO(png_bytes), "dog.png"),
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 200
    assert response.get_json()["disease"] == "Healthy"
    assert response.get_json()["confidence"] == 0.97


# 10. Breed prediction response (ML function mocked)
def test_breed_prediction_api(client, png_bytes, monkeypatch):
    expected = {
        "animal": "cat",
        "breed": "siamese",
        "confidence": 0.91,
    }
    monkeypatch.setattr(
        Server.inference,
        "predict_breed",
        lambda animal, image: expected,
    )

    response = client.post(
        "/api/detect-breed",
        data={
            "animal": "cat",
            "image": (io.BytesIO(png_bytes), "cat.png"),
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 200
    assert response.get_json()["breed"] == "siamese"


# 11. Missing breed in recommendations
def test_recommendation_requires_breed(client):
    response = client.post(
        "/api/recommend",
        json={"animal": "dog", "age_group": "adult"},
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


# 12. Invalid animal in recommendations
def test_recommendation_rejects_invalid_animal(client):
    response = client.post(
        "/api/recommend",
        json={
            "animal": "horse",
            "breed": "Unknown",
            "age_group": "adult",
        },
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


# 13. Age-group calculation
@pytest.mark.parametrize(
    ("animal", "age", "unit", "expected"),
    [
        ("dog", 0.5, "years", "young"),
        ("dog", 4, "years", "adult"),
        ("dog", 9, "years", "senior"),
        ("cat", 5, "years", "adult"),
        ("cat", 11, "years", "senior"),
        ("cattle", 1, "years", "young"),
        ("dog", 6, "months", "young"),
        ("dog", 24, "months", "adult"),
    ],
)
def test_age_group(animal, age, unit, expected):
    assert Server.age_to_group(animal, age, unit) == expected


# 14. Invalid age
@pytest.mark.parametrize("age", [-1, "invalid", None])
def test_invalid_age(age):
    with pytest.raises((ValueError, TypeError)):
        Server.age_to_group("dog", age, "years")
def test_disease_invalid_image_format(client):
    response = client.post(
        "/api/detect-disease",
        data={
            "animal": "dog",
            "image": (
                io.BytesIO(b"invalid image data"),
                "test.png",
            ),
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 200


# 15. Recommendation response (recommendation function mocked)
def test_recommendation_api(client, monkeypatch):
    expected = {
        "animal_type": "dog",
        "breed": "Beagle",
        "age_group": "adult",
    }
    monkeypatch.setattr(
        Server,
        "get_recommendations",
        lambda **kwargs: expected,
    )

    response = client.post(
        "/api/recommend",
        json={
            "animal": "dog",
            "breed": "Beagle",
            "age_group": "adult",
        },
    )

    assert response.status_code == 200
    assert response.get_json() == expected
