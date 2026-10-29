/*
 * Session guard: pages that need a logged-in user load this script.
 * If the backend says "not logged in" (401), go back to the login page.
 * If the backend cannot be reached, stay on the page (it shows its own error).
 */
(function () {

    const loginUrl = new URL("../index.html", document.currentScript.src).href;
    const base = (window.VETVISION_API_BASE_URL || "").replace(/\/$/, "");

    fetch(base + "/api/profile", { credentials: "include" })
        .then(function (response) {
            if (response.status === 401) {
                window.location.replace(loginUrl);
            }
        })
        .catch(function () {
            /* backend unreachable: do nothing */
        });

})();
