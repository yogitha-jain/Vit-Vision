document.addEventListener("DOMContentLoaded", () => {

    const loginForm =
        document.getElementById("loginForm");

    const signupForm =
        document.getElementById("signupForm");

    const password =
        document.getElementById("password");

    const passwordToggle =
        document.getElementById("passwordToggle");

    const forgotPassword =
        document.getElementById("forgotPassword");


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

            alert(
                "Password recovery will be connected after backend integration."
            );

        });

    }


    /* =====================================================
       LOGIN
    ====================================================== */

    if (loginForm) {

        loginForm.addEventListener("submit", (event) => {

            event.preventDefault();

            const emailInput =
                document.getElementById("email");

            const passwordInput =
                document.getElementById("password");


            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";

            const passwordValue =
                passwordInput
                    ? passwordInput.value
                    : "";


            if (!email) {

                showAuthMessage(
                    "Please enter your email.",
                    "error"
                );

                return;

            }


            if (!passwordValue) {

                showAuthMessage(
                    "Please enter your password.",
                    "error"
                );

                return;

            }


            /*
             * FRONTEND-ONLY LOGIN
             * No OTP.
             */

            sessionStorage.setItem(
                "vetvisionLoginEmail",
                email
            );


            showAuthMessage(
                "Login successful.",
                "success"
            );


            /*
             * Login page is index.html,
             * so dashboard is inside pages/.
             */

            setTimeout(() => {

                window.location.href =
                    "pages/dashboard.html";

            }, 300);

        });

    }


    /* =====================================================
       SIGN UP
    ====================================================== */

    if (signupForm) {

        signupForm.addEventListener("submit", (event) => {

            event.preventDefault();


            const nameInput =
                document.getElementById("name");

            const emailInput =
                document.getElementById("email");

            const passwordInput =
                document.getElementById("password");

            const confirmPasswordInput =
                document.getElementById("confirmPassword");


            const name =
                nameInput
                    ? nameInput.value.trim()
                    : "";

            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";

            const passwordValue =
                passwordInput
                    ? passwordInput.value
                    : "";

            const confirmPasswordValue =
                confirmPasswordInput
                    ? confirmPasswordInput.value
                    : "";


            /* Check all fields */

            if (
                !name ||
                !email ||
                !passwordValue ||
                !confirmPasswordValue
            ) {

                showAuthMessage(
                    "Please fill in all fields.",
                    "error"
                );

                return;

            }


            /* Check password match */

            if (
                passwordValue !==
                confirmPasswordValue
            ) {

                showAuthMessage(
                    "Passwords do not match.",
                    "error"
                );

                return;

            }


            /*
             * Save signup information
             * for frontend use.
             */

            sessionStorage.setItem(
                "vetvisionSignupData",
                JSON.stringify({
                    name: name,
                    email: email
                })
            );


            /*
             * NO OTP
             *
             * Signup goes directly
             * to dashboard.
             */

            showAuthMessage(
                "Account created successfully.",
                "success"
            );


            /*
             * signup.html is already inside
             * the pages folder.
             *
             * Therefore dashboard.html is
             * directly beside signup.html.
             */

            setTimeout(() => {

                window.location.href =
                    "dashboard.html";

            }, 500);

        });

    }

});


/* =====================================================
   AUTH MESSAGE
===================================================== */

function showAuthMessage(message, type) {

    const messageElement =
        document.getElementById("loginMessage") ||
        document.getElementById("signupMessage");


    if (!messageElement) {

        alert(message);

        return;

    }


    messageElement.textContent =
        message;


    messageElement.className =
        "auth-message";


    if (type) {

        messageElement.classList.add(
            `auth-message-${type}`
        );

    }

}