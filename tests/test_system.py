"""
VetVision system (end-to-end) tests.
Starts the real backend + frontend, no mocking. Tests the full flow:
login -> select animal -> upload image -> real ML prediction -> result.

Setup:
    pip install pytest pytest-playwright requests flask-cors
    playwright install chromium

Put real photos here (JPG, clear single animal):
    tests/assets/dog.jpg
    tests/assets/cat.jpg
    tests/assets/cattle.jpg

Run from project root:
    pytest tests/test_system.py -v -s
"""

import functools
import http.server
import os
import re
import socket
import subprocess
import sys
import threading
import time
from pathlib import Path

import pytest
import requests
from playwright.sync_api import Page, expect

# ---------------- CONFIG: adjust these to match your project ----------------
PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "vet-vision-frontend--main"
ASSETS = PROJECT_ROOT / "tests" / "assets"
BACKEND_PORT = 5000
BACKEND_URL = f"http://127.0.0.1:{BACKEND_PORT}"
# Server.py only allows CORS from FRONTEND_ORIGINS, so the test frontend runs on a
# fixed port and the backend is started with that origin allowed.
# (5501, not 5500, so it does not clash with VS Code Live Server.)
FRONTEND_PORT = 5501
FRONTEND_ORIGIN = f"http://127.0.0.1:{FRONTEND_PORT}"
# A REAL account that exists in your MongoDB (create it once via the Sign Up page).
TEST_EMAIL = os.getenv("TEST_EMAIL", "systest@example.com")
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "SysTest123")
RESULT_SELECTOR = "#resultSection"   # element shown after analysis
MODEL_TIMEOUT = 60_000               # ms; first prediction loads the model
# ----------------------------------------------------------------------------


def sample_path(animal):
    p = ASSETS / f"{animal}.jpg"
    assert p.exists(), f"Add a real photo at {p}"
    return p


def sample_bytes(animal):
    return sample_path(animal).read_bytes()


def wait_for_port(port, timeout=90):
    end = time.time() + timeout
    while time.time() < end:
        with socket.socket() as s:
            s.settimeout(1)
            if s.connect_ex(("127.0.0.1", port)) == 0:
                return True
        time.sleep(1)
    return False


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


@pytest.fixture(scope="session")
def backend():
    """Start the real Flask backend as a subprocess."""
    env = {**os.environ, "FRONTEND_ORIGINS": FRONTEND_ORIGIN}
    proc = subprocess.Popen(
        [sys.executable, "Server.py"],
        cwd=str(BACKEND_DIR),
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    if not wait_for_port(BACKEND_PORT):
        proc.terminate()
        pytest.fail("Backend did not start. Check BACKEND_PORT and Server.py.")
    yield BACKEND_URL
    proc.terminate()
    proc.wait(timeout=10)


@pytest.fixture(scope="session")
def frontend_url(backend):
    """Serve the static frontend (depends on backend so it is up first)."""
    handler = functools.partial(QuietHandler, directory=str(FRONTEND_DIR))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", FRONTEND_PORT), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    yield FRONTEND_ORIGIN
    server.shutdown()
    server.server_close()


# =========================== BACKEND SYSTEM TESTS ===========================

def test_sys_backend_health(backend):
    r = requests.get(f"{backend}/api/health", timeout=10)
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.parametrize("animal", ["dog", "cat", "cattle"])
def test_sys_real_disease_prediction(backend, animal):
    r = requests.post(
        f"{backend}/api/detect-disease",
        data={"animal": animal},
        files={"image": (f"{animal}.jpg", sample_bytes(animal), "image/jpeg")},
        timeout=120,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert "disease" in body or "prediction" in body, body
    conf = body.get("confidence")
    if conf is not None:
        assert 0 <= conf <= 1


@pytest.mark.parametrize("animal", ["dog", "cat", "cattle"])
def test_sys_real_breed_prediction(backend, animal):
    r = requests.post(
        f"{backend}/api/detect-breed",
        data={"animal": animal},
        files={"image": (f"{animal}.jpg", sample_bytes(animal), "image/jpeg")},
        timeout=120,
    )
    assert r.status_code == 200, r.text
    assert "breed" in r.json(), r.json()


def test_sys_recommendation_pipeline(backend):
    """Breed prediction output feeds the recommendation endpoint."""
    r = requests.post(
        f"{backend}/api/detect-breed",
        data={"animal": "dog"},
        files={"image": ("dog.jpg", sample_bytes("dog"), "image/jpeg")},
        timeout=120,
    )
    assert r.status_code == 200, r.text

    rec = requests.post(
        f"{backend}/api/recommend",
        json={"animal": "dog", "breed": r.json()["breed"], "age_group": "adult"},
        timeout=30,
    )
    assert rec.status_code == 200, rec.text
    assert rec.json()


def test_sys_backend_rejects_bad_input(backend):
    r = requests.post(f"{backend}/api/detect-disease", data={"animal": "dog"}, timeout=10)
    assert r.status_code == 400

    r = requests.post(
        f"{backend}/api/detect-breed",
        data={"animal": "horse"},
        files={"image": ("a.png", b"junk", "image/png")},
        timeout=10,
    )
    assert r.status_code == 400


def test_sys_cors_allows_frontend_origin(backend):
    r = requests.options(
        f"{backend}/api/detect-disease",
        headers={
            "Origin": FRONTEND_ORIGIN,
            "Access-Control-Request-Method": "POST",
        },
        timeout=10,
    )
    assert r.headers.get("Access-Control-Allow-Origin") == FRONTEND_ORIGIN


def test_sys_cors_blocks_unknown_origin(backend):
    r = requests.options(
        f"{backend}/api/detect-disease",
        headers={
            "Origin": "http://evil.example.com",
            "Access-Control-Request-Method": "POST",
        },
        timeout=10,
    )
    assert "Access-Control-Allow-Origin" not in r.headers


# ========================= FULL-STACK (BROWSER) TESTS =======================

def login(page, frontend_url):
    page.goto(frontend_url + "/index.html")
    page.locator("#email").fill(TEST_EMAIL)
    page.locator("#password").fill(TEST_PASSWORD)
    page.locator("#loginButton").click()
    try:
        page.wait_for_url("**/pages/dashboard.html", timeout=8000)
    except Exception:
        try:
            msg = page.locator("#loginMessage").inner_text(timeout=1000)
        except Exception:
            msg = "<no #loginMessage found>"
        pytest.fail(f"No redirect to dashboard. url={page.url!r}, loginMessage={msg!r}")


def test_sys_login_to_dashboard(frontend_url, page: Page):
    login(page, frontend_url)
    expect(page).to_have_title("VetVision | Dashboard")


@pytest.mark.parametrize("animal", ["dog", "cat", "cattle"])
def test_sys_full_flow_upload_and_analyze(frontend_url, page: Page, animal):
    """Login -> pick animal -> upload -> Analyze -> real backend result."""
    login(page, frontend_url)
    page.goto(frontend_url + "/pages/animal-selection.html")

    page.locator(f'.animal-card[data-animal="{animal}"]').click()
    expect(page.locator("#animalUploadSection")).to_be_visible()

    page.locator("#imageInput").set_input_files(str(sample_path(animal)))
    expect(page.locator("#imagePreview")).to_have_attribute("src", re.compile(r"^blob:"))
    expect(page.locator("#analyzeBtn")).to_be_enabled()

    with page.expect_response(
        lambda r: "/api/detect" in r.url, timeout=MODEL_TIMEOUT
    ) as resp_info:
        page.locator("#analyzeBtn").click()

    assert resp_info.value.status == 200, resp_info.value.text()
    expect(page.locator(RESULT_SELECTOR)).to_be_visible(timeout=MODEL_TIMEOUT)


def test_sys_navigation_between_pages(frontend_url, page: Page):
    login(page, frontend_url)
    for name, title in [
        ("animal-selection.html", "VetVision | Select Animal"),
        ("history.html", "History - VetVision"),
        ("recommendations.html", "Recommendations - VetVision"),
        ("profile.html", "Profile - VetVision"),
        ("settings.html", "Settings - VetVision"),
    ]:
        page.goto(frontend_url + "/pages/" + name)
        expect(page).to_have_title(title)


def test_sys_frontend_handles_backend_down(frontend_url, page: Page):
    """Block API calls and confirm the UI does not crash or hang silently."""
    login(page, frontend_url)
    page.goto(frontend_url + "/pages/animal-selection.html")
    page.route("**/api/**", lambda route: route.abort())

    page.locator('.animal-card[data-animal="dog"]').click()
    page.locator("#imageInput").set_input_files(str(sample_path("dog")))
    page.locator("#analyzeBtn").click()

    page.wait_for_timeout(3000)
    expect(page).to_have_title("VetVision | Select Animal")  # page still alive
    expect(page.locator(RESULT_SELECTOR)).not_to_be_visible()


def test_sys_logout(frontend_url, page: Page):
    login(page, frontend_url)
    page.goto(frontend_url + "/pages/settings.html")
    page.locator("#logoutBtn").click()
    page.wait_for_url("**/index.html", timeout=5000)