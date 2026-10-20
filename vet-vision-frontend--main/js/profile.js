document.addEventListener("DOMContentLoaded", loadProfile);


/* =========================================
   LOAD PROFILE
========================================= */

async function loadProfile() {

    const profileCard =
        document.getElementById("profileCard");

    if (!profileCard) {
        return;
    }


    /*
        Show placeholder immediately.

        This keeps the page looking complete
        while the backend is not connected.
    */

    showProfilePlaceholder(profileCard);


    try {

        const baseURL =
            window.VETVISION_API_BASE_URL || "";


        const response =
            await fetch(
                `${baseURL}/api/profile`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );


        if (!response.ok) {
            throw new Error("Profile request failed.");
        }


        const data =
            await response.json();


        /*
            Render actual backend data
            when available.
        */

        renderProfile(
            data,
            profileCard
        );

    }


    catch (error) {

        /*
            Backend is not connected yet.

            Keep the placeholder instead of
            showing an error message.
        */

        showProfilePlaceholder(profileCard);

    }

}



/* =========================================
   PLACEHOLDER PROFILE
========================================= */

function showProfilePlaceholder(container) {

    container.innerHTML = `

        <div class="profile-header">

            <div class="profile-avatar">
                <span>◯</span>
            </div>


            <div class="profile-user">

                <h2>
                    Your Name
                </h2>

                <p>
                    your@email.com
                </p>

            </div>

        </div>


        <div class="profile-details">

            <div class="profile-detail">

                <span class="profile-detail-label">
                    Name
                </span>

                <strong>
                    Your Name
                </strong>

            </div>


            <div class="profile-detail">

                <span class="profile-detail-label">
                    Email
                </span>

                <strong>
                    your@email.com
                </strong>

            </div>

        </div>

    `;
}



/* =========================================
   RENDER ACTUAL PROFILE
========================================= */

function renderProfile(
    data,
    container
) {

    let name = "";
    let email = "";


    /*
        Direct backend response:
        {
            name: "...",
            email: "..."
        }
    */

    if (
        data &&
        typeof data === "object"
    ) {

        name =
            data.name ??
            "";

        email =
            data.email ??
            "";


        /*
            Also support:
            {
                user: {
                    name: "...",
                    email: "..."
                }
            }
        */

        if (
            data.user &&
            typeof data.user === "object"
        ) {

            if (!name) {
                name =
                    data.user.name ??
                    "";
            }

            if (!email) {
                email =
                    data.user.email ??
                    "";
            }

        }

    }


    /*
        If backend returns incomplete data,
        keep the placeholder for missing fields.
    */

    if (!name) {
        name = "Your Name";
    }

    if (!email) {
        email = "your@email.com";
    }


    container.innerHTML = `

        <div class="profile-header">

            <div class="profile-avatar">
                <span>◯</span>
            </div>


            <div class="profile-user">

                <h2>
                    ${escapeHTML(name)}
                </h2>

                <p>
                    ${escapeHTML(email)}
                </p>

            </div>

        </div>


        <div class="profile-details">

            <div class="profile-detail">

                <span class="profile-detail-label">
                    Name
                </span>

                <strong>
                    ${escapeHTML(name)}
                </strong>

            </div>


            <div class="profile-detail">

                <span class="profile-detail-label">
                    Email
                </span>

                <strong>
                    ${escapeHTML(email)}
                </strong>

            </div>

        </div>

    `;
}



/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}