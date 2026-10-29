"""
VetVision frontend UI tests using pytest + Playwright.

Run these from the project root:
    pip install pytest pytest-playwright
    playwright install chromium
    pytest tests/test_frontend_playwright.py -v -s
"""

import functools
import http.server
import os
import socket
import subprocess
import sys
import threading
import time
from pathlib import Path

import pytest
from playwright.sync_api import Page, expect


PROJECT_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_DIR = PROJECT_ROOT / "vet-vision-frontend--main"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


@pytest.fixture(scope="session")
def frontend_url():
    """Serve the static frontend on a free local port for browser tests."""
    if not FRONTEND_DIR.exists():
        pytest.fail(
            f"Frontend folder not found: {FRONTEND_DIR}. "
            "Place this test file inside the Vit-Vision-main/tests folder."
        )

    handler = functools.partial(
        QuietHandler, directory=str(FRONTEND_DIR)
    )
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    yield f"http://127.0.0.1:{server.server_port}"

    server.shutdown()
    server.server_close()
    thread.join(timeout=2)


def test_login_page_loads(frontend_url, page: Page):
    page.goto(frontend_url + "/index.html")

    expect(page).to_have_title("VetVision | Login")
    expect(page.get_by_role("heading", name="Welcome Back")).to_be_visible()
    expect(page.locator("#email")).to_be_visible()
    expect(page.locator("#password")).to_be_visible()
    expect(page.locator("#loginButton")).to_be_visible()
    expect(page.get_by_role("link", name="Sign Up")).to_have_attribute(
        "href", "pages/signup.html"
    )


def test_password_show_hide_toggle(frontend_url, page: Page):
    page.goto(frontend_url + "/index.html")
    password = page.locator("#password")

    expect(password).to_have_attribute("type", "password")
    page.locator("#passwordToggle").click()
    expect(password).to_have_attribute("type", "text")

    page.locator("#passwordToggle").click()
    expect(password).to_have_attribute("type", "password")


def test_forgot_password_message(frontend_url, page: Page):
    page.goto(frontend_url + "/index.html")
    page.once("dialog", lambda dialog: dialog.accept())
    page.locator("#forgotPassword").click()


def test_login_with_valid_fields_redirects_to_dashboard(
    frontend_url, page: Page
):
    page.goto(frontend_url + "/index.html")
    page.locator("#email").fill("test@example.com")
    page.locator("#password").fill("TestPassword123")
    page.locator("#loginButton").click()

    expect(page.locator("#loginMessage")).to_contain_text("Login successful.")
    page.wait_for_url("**/pages/dashboard.html", timeout=5000)
    expect(page).to_have_title("VetVision | Dashboard")
    assert page.evaluate(
        "() => sessionStorage.getItem('vetvisionLoginEmail')"
    ) == "test@example.com"


def test_signup_page_loads(frontend_url, page: Page):
    page.goto(frontend_url + "/pages/signup.html")

    expect(page).to_have_title("VetVision | Sign Up")
    expect(page.locator("#signupForm")).to_be_visible()
    expect(page.locator("#name")).to_be_visible()
    expect(page.locator("#email")).to_be_visible()
    expect(page.locator("#password")).to_be_visible()
    expect(page.locator("#confirmPassword")).to_be_visible()


def test_signup_rejects_mismatched_passwords(frontend_url, page: Page):
    page.goto(frontend_url + "/pages/signup.html")
    page.locator("#name").fill("Test User")
    page.locator("#email").fill("test@example.com")
    page.locator("#password").fill("Password123")
    page.locator("#confirmPassword").fill("Different123")
    page.locator("#signupButton").click()

    expect(page.locator("#signupMessage")).to_contain_text(
        "Passwords do not match."
    )



@pytest.mark.parametrize(
    "page_name, expected_title",
    [
        ("dashboard.html", "VetVision | Dashboard"),
        ("animal-selection.html", "VetVision | Select Animal"),
        ("history.html", "History - VetVision"),
        ("profile.html", "Profile - VetVision"),
        ("recommendations.html", "Recommendations - VetVision"),
        ("settings.html", "Settings - VetVision"),
    ],
)
def test_main_pages_load(frontend_url, page: Page, page_name, expected_title):
    response = page.goto(
        frontend_url + "/pages/" + page_name,
        wait_until="domcontentloaded",
        timeout=10000,
    )

    assert response is not None
    assert response.status == 200
    expect(page).to_have_title(expected_title)


def test_animal_selection_reveals_upload_section(frontend_url, page: Page):
    page.goto(frontend_url + "/pages/animal-selection.html")

    # The animal cards use data-animal="dog", "cat", or "cattle".
    dog_card = page.locator('.animal-card[data-animal="dog"]')
    expect(dog_card).to_be_visible()
    dog_card.click()

    expect(dog_card).to_have_class(__import__("re").compile(r".*selected.*"))
    expect(page.locator("#animalUploadSection")).to_be_visible()
    expect(page.locator("#uploadTitle")).to_contain_text("dog")
    expect(page.locator("#analyzeBtn")).to_be_disabled()


def test_image_upload_shows_preview_and_enables_analyze(
    frontend_url, page: Page
):
    page.goto(frontend_url + "/pages/animal-selection.html")
    page.locator('.animal-card[data-animal="cat"]').click()

    image_path = FRONTEND_DIR / "assets" / "cat.png"
    assert image_path.exists(), f"Test image not found: {image_path}"

    page.locator("#imageInput").set_input_files(str(image_path))

    expect(page.locator("#previewContainer")).to_be_visible()
    expect(page.locator("#imagePreview")).to_have_attribute(
        "src", __import__("re").compile(r"^blob:")
    )
    expect(page.locator("#analyzeBtn")).to_be_enabled()
    expect(page.locator("#analyzeBtn")).to_contain_text("Analyze Image")


def test_settings_password_form_is_present(frontend_url, page: Page):
    page.goto(frontend_url + "/pages/settings.html")

    expect(page.locator("#passwordForm")).to_be_visible()
    expect(page.locator("#currentPassword")).to_be_visible()
    expect(page.locator("#newPassword")).to_be_visible()
    expect(page.locator("#confirmPassword")).to_be_visible()
    expect(page.locator("#logoutBtn")).to_be_visible()
