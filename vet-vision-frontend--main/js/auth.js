document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const password = document.getElementById("password");
    const passwordToggle = document.getElementById("passwordToggle");
    const forgotPassword = document.getElementById("forgotPassword");


    /* =====================================================
       PASSWORD SHOW / HIDE
    ====================================================== */

    if (passwordToggle && password) {

        passwordToggle.addEventListener("click", () => {

            if (password.type === "password") {

                password.type = "text";
                passwordToggle.textContent = "🙈";

            } else {

                password.type = "password";
                passwordToggle.textContent = "👁";

            }

        });

    }


    /* =====================================================
       FORGOT PASSWORD
    ====================================================== */

    if (forgotPassword) {

        forgotPassword.addEventListener("click", (event) => {

            event.preventDefault();

            alert("Password recovery is not available yet.");

        });

    }


    /* =====================================================
       LOGIN
    ====================================================== */

    if (loginForm) {

        loginForm.addEventListener("submit", async (event) => {

            event.preventDefault();

            const emailInput = document.getElementById("email");
            const passwordInput = document.getElementById("password");

            const email = emailInput ? emailInput.value.trim() : "";
            const passwordValue = passwordInput ? passwordInput.value : "";

            if (!email) {
                showAuthMessage("Please enter your email.", "error");
                return;
            }

            if (!passwordValue) {
                showAuthMessage("Please enter your password.", "error");
                return;
            }

            const button = document.getElementById("loginButton");

            setBusy(button, true, "Logging in...");

            try {

                await postJson("/api/login", {
                    email: email,
                    password: passwordValue
                });

                showAuthMessage("Login successful.", "success");

                /* Login page is index.html, so the dashboard is inside pages/. */
                setTimeout(() => {
                    window.location.href = "pages/dashboard.html";
                }, 300);

            }

            catch (error) {

                showAuthMessage(error.message, "error");
                setBusy(button, false);

            }

        });

    }


    /* =====================================================
       SIGN UP
    ====================================================== */

    if (signupForm) {

        signupForm.addEventListener("submit", async (event) => {

            event.preventDefault();

            const nameInput = document.getElementById("name");
            const emailInput = document.getElementById("email");
            const passwordInput = document.getElementById("password");
            const confirmPasswordInput = document.getElementById("confirmPassword");

            const name = nameInput ? nameInput.value.trim() : "";
            const email = emailInput ? emailInput.value.trim() : "";
            const passwordValue = passwordInput ? passwordInput.value : "";
            const confirmPasswordValue =
                confirmPasswordInput ? confirmPasswordInput.value : "";

            if (!name || !email || !passwordValue || !confirmPasswordValue) {
                showAuthMessage("Please fill in all fields.", "error");
                return;
            }

            if (passwordValue !== confirmPasswordValue) {
                showAuthMessage("Passwords do not match.", "error");
                return;
            }

            if (passwordValue.length < 8) {
                showAuthMessage("Password must be at least 8 characters.", "error");
                return;
            }

            const button = document.getElementById("signupButton");

            setBusy(button, true, "Creating account...");

            try {

                await postJson("/api/signup", {
                    name: name,
                    email: email,
                    password: passwordValue
                });

            }

            catch (error) {

                showAuthMessage(error.message, "error");
                setBusy(button, false);
                return;

            }

            /* Account created: log in straight away. */

            try {

                await postJson("/api/login", {
                    email: email,
                    password: passwordValue
                });

                showAuthMessage("Account created successfully.", "success");

                /* signup.html is inside pages/, so the dashboard is beside it. */
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 500);

            }

            catch (error) {

                showAuthMessage(
                    "Account created. Please log in.",
                    "success"
                );

                setTimeout(() => {
                    window.location.href = "../index.html";
                }, 1200);

            }

        });

    }

});


/* =====================================================
   HELPERS
===================================================== */

async function postJson(path, body) {

    const base = (window.VETVISION_API_BASE_URL || "").replace(/\/$/, "");

    let response;

    try {

        response = await fetch(base + path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(body)
        });

    }

    catch (error) {

        throw new Error(
            "Cannot reach the VetVision backend. " +
            "Make sure it is running (python backend/server.py)."
        );

    }

    let data = null;

    try {
        data = await response.json();
    }
    catch (error) {
        data = null;
    }

    if (!response.ok) {

        throw new Error(
            (data && (data.message || data.error)) ||
            `Request failed (${response.status}).`
        );

    }

    return data;

}


function setBusy(button, busy, text) {

    if (!button) {
        return;
    }

    if (busy) {

        button.dataset.label = button.textContent;
        button.textContent = text;
        button.disabled = true;

    }

    else {

        button.textContent = button.dataset.label || button.textContent;
        button.disabled = false;

    }

}


function showAuthMessage(message, type) {

    const messageElement =
        document.getElementById("loginMessage") ||
        document.getElementById("signupMessage");

    if (!messageElement) {

        alert(message);

        return;

    }

    messageElement.textContent = message;
    messageElement.className = "auth-message";

    if (type) {

        messageElement.classList.add(`auth-message-${type}`);

    }

}
