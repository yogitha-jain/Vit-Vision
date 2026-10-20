document.addEventListener(
    "DOMContentLoaded",
    initializeSettings
);


function initializeSettings() {

    const changePasswordForm =
        document.getElementById(
            "changePasswordForm"
        );

    const currentPassword =
        document.getElementById(
            "currentPassword"
        );

    const newPassword =
        document.getElementById(
            "newPassword"
        );

    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        );

    const changePasswordBtn =
        document.getElementById(
            "changePasswordBtn"
        );

    const passwordMessage =
        document.getElementById(
            "passwordMessage"
        );

    const logoutButton =
        document.getElementById(
            "settingsLogoutBtn"
        );



    /* =================================
       CHANGE PASSWORD
    ================================= */

    changePasswordForm?.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (passwordMessage) {

                passwordMessage.textContent = "";

                passwordMessage.className =
                    "settings-message";

            }


            const current =
                currentPassword.value.trim();

            const newPasswordValue =
                newPassword.value.trim();

            const confirm =
                confirmPassword.value.trim();


            /*
                Basic frontend validation.
            */

            if (!current) {

                showMessage(
                    "Please enter your current password.",
                    "error"
                );

                return;

            }


            if (!newPasswordValue) {

                showMessage(
                    "Please enter a new password.",
                    "error"
                );

                return;

            }


            if (!confirm) {

                showMessage(
                    "Please confirm your new password.",
                    "error"
                );

                return;

            }


            if (
                newPasswordValue !==
                confirm
            ) {

                showMessage(
                    "New passwords do not match.",
                    "error"
                );

                return;

            }


            /*
                Disable button while request
                is being processed.
            */

            if (changePasswordBtn) {

                changePasswordBtn.disabled =
                    true;

                changePasswordBtn.textContent =
                    "Changing...";

            }


            try {

                const baseURL =
                    window.VETVISION_API_BASE_URL ||
                    "";


                /*
                    Backend integration point.

                    Your friend can change the
                    endpoint or field names
                    according to her backend.
                */

                const response =
                    await fetch(
                        `${baseURL}/api/change-password`,
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            credentials:
                                "include",

                            body:
                                JSON.stringify({

                                    currentPassword:
                                        current,

                                    newPassword:
                                        newPasswordValue

                                })

                        }
                    );


                if (!response.ok) {

                    let message =
                        "Unable to change password.";

                    try {

                        const errorData =
                            await response.json();

                        if (
                            errorData.message
                        ) {

                            message =
                                errorData.message;

                        }

                    }

                    catch {

                        /*
                            Keep default message.
                        */

                    }


                    throw new Error(
                        message
                    );

                }


                /*
                    Password was successfully
                    changed by the backend.
                */

                showMessage(
                    "Password changed successfully.",
                    "success"
                );


                /*
                    Clear password fields.
                */

                currentPassword.value =
                    "";

                newPassword.value =
                    "";

                confirmPassword.value =
                    "";

            }


            catch (error) {

                showMessage(
                    error.message ||
                    "Unable to change password.",
                    "error"
                );

            }


            finally {

                if (changePasswordBtn) {

                    changePasswordBtn.disabled =
                        false;

                    changePasswordBtn.textContent =
                        "Change Password";

                }

            }

        }
    );



    /* =================================
       LOGOUT
    ================================= */

    logoutButton?.addEventListener(
        "click",
        async () => {

            const confirmLogout =
                window.confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmLogout) {
                return;
            }


            try {

                const baseURL =
                    window.VETVISION_API_BASE_URL ||
                    "";


                /*
                    Ask backend to end the
                    current authenticated session.
                */

                await fetch(
                    `${baseURL}/api/logout`,
                    {

                        method: "POST",

                        credentials:
                            "include"

                    }
                );

            }

            catch {

                /*
                    Even if the backend logout
                    request fails, leave the
                    protected frontend.
                */

            }


            /*
                Clear frontend session data.
            */

            sessionStorage.removeItem(
                "vetvisionBreedResult"
            );

            sessionStorage.removeItem(
                "vetvisionRecommendationResult"
            );

            localStorage.removeItem(
                "selectedAnimal"
            );


            /*
                Return to login page.
            */

            window.location.href =
                "../index.html";

        }
    );



    /*
        Sidebar logout should use the
        same logout behavior.
    */

    const sidebarLogout =
        document.getElementById(
            "logoutLink"
        );


    sidebarLogout?.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();


            const confirmLogout =
                window.confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmLogout) {
                return;
            }


            try {

                const baseURL =
                    window.VETVISION_API_BASE_URL ||
                    "";


                await fetch(
                    `${baseURL}/api/logout`,
                    {

                        method: "POST",

                        credentials:
                            "include"

                    }
                );

            }

            catch {

                /*
                    Continue to login even if
                    backend logout fails.
                */

            }


            sessionStorage.removeItem(
                "vetvisionBreedResult"
            );

            sessionStorage.removeItem(
                "vetvisionRecommendationResult"
            );

            localStorage.removeItem(
                "selectedAnimal"
            );


            window.location.href =
                "../index.html";

        }
    );

}



/* =================================
   MESSAGE
================================= */

function showMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "passwordMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `settings-message ${type}`;

}