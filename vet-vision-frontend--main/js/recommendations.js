document.addEventListener("DOMContentLoaded", function () {
    initializeTabs();
    loadRecommendations();
});


/* =========================================================
   CATEGORY TABS
========================================================= */

function initializeTabs() {

    const tabs =
        document.querySelectorAll(
            ".recommendation-tab"
        );

    const sections =
        document.querySelectorAll(
            ".recommendation-section"
        );


    if (!tabs.length || !sections.length) {
        return;
    }


    tabs.forEach(function (tab) {

        tab.addEventListener(
            "click",
            function () {

                const target =
                    tab.getAttribute(
                        "data-section"
                    );


                /* Remove active from all buttons */

                tabs.forEach(function (item) {

                    item.classList.remove(
                        "active"
                    );

                });


                /* Hide all recommendation sections */

                sections.forEach(function (section) {

                    section.classList.remove(
                        "active"
                    );

                });


                /* Activate clicked button */

                tab.classList.add(
                    "active"
                );


                /* Show matching section */

                const targetSection =
                    document.getElementById(
                        target + "Section"
                    );


                if (targetSection) {

                    targetSection.classList.add(
                        "active"
                    );

                }

            }
        );

    });

}


/* =========================================================
   LOAD SAVED DATA
========================================================= */

function loadRecommendations() {

    const storedData =
        sessionStorage.getItem(
            "vetvisionRecommendationResult"
        );


    if (!storedData) {

        showEmptyData();

        return;

    }


    let data;


    try {

        data =
            JSON.parse(
                storedData
            );

    }

    catch (error) {

        showEmptyData();

        return;

    }


    /* -----------------------------------------
       SUMMARY
    ----------------------------------------- */

    setText(
        "animalType",
        data.animalType
    );


    setText(
        "animalBreed",
        data.breed
    );


    if (
        data.age !== undefined &&
        data.age !== null &&
        data.age !== ""
    ) {

        setText(
            "animalAge",
            `${data.age} ${data.ageUnit || "years"}`
        );

    }

    else {

        setText(
            "animalAge",
            null
        );

    }


    /* -----------------------------------------
       UPLOADED IMAGE
    ----------------------------------------- */

    const animalImage =
        document.getElementById(
            "animalImage"
        );

    const animalImageContainer =
        document.getElementById(
            "animalImageContainer"
        );


    if (
        animalImage &&
        animalImageContainer &&
        data.imageUrl
    ) {

        animalImage.src =
            data.imageUrl;

        animalImageContainer.style.display =
            "flex";

    }


    /* -----------------------------------------
       RECOMMENDATIONS FROM THE BACKEND
    ----------------------------------------- */

    if (data.animalType && data.breed) {

        fetchRecommendations(data);

    }

    else {

        showEmptyData();

    }

}


/* =========================================================
   FETCH RECOMMENDATIONS FROM THE BACKEND
========================================================= */

const RECOMMENDATION_SECTIONS = [
    "dietContent",
    "groomingContent",
    "vaccinationContent",
    "exerciseContent",
    "healthContent"
];


/*
    Use the disease result only if it is recent, confident,
    and for the same type of animal.
*/

function getRecentDisease(animal) {

    try {

        const saved = JSON.parse(
            sessionStorage.getItem("vetvisionDiseaseResult") || "null"
        );

        if (!saved || saved.animalType !== animal) {
            return null;
        }

        if (Date.now() - (saved.savedAt || 0) > 30 * 60 * 1000) {
            return null;
        }

        if (saved.lowConfidence) {
            return null;
        }

        return saved.disease || null;

    }

    catch (error) {

        return null;

    }

}


async function fetchRecommendations(data) {

    RECOMMENDATION_SECTIONS.forEach(function (id) {
        renderRecommendation(id, "Loading recommendations...");
    });

    const base =
        (window.VETVISION_API_BASE_URL || "").replace(/\/$/, "");

    try {

        const response = await fetch(
            base + "/api/recommend",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    animal: data.animalType,
                    breed: data.breedRaw || data.breed,
                    age: data.age,
                    age_unit: data.ageUnit,
                    disease: getRecentDisease(data.animalType)
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Request failed.");
        }

        renderRecommendation("dietContent", result.diet);
        renderRecommendation("groomingContent", result.grooming);
        renderRecommendation("vaccinationContent", result.vaccination);
        renderRecommendation("exerciseContent", result.activity);
        renderRecommendation("healthContent", result.health_guidance);

    }

    catch (error) {

        console.error("VetVision recommendation error:", error);

        RECOMMENDATION_SECTIONS.forEach(function (id) {
            renderRecommendation(
                id,
                "Could not load recommendations. " +
                "Make sure the backend is running (python backend/server.py)."
            );
        });

    }

}


/* =========================================================
   EMPTY DATA
========================================================= */

function showEmptyData() {

    setText(
        "animalType",
        null
    );

    setText(
        "animalBreed",
        null
    );

    setText(
        "animalAge",
        null
    );


    renderRecommendation(
        "dietContent",
        null
    );

    renderRecommendation(
        "groomingContent",
        null
    );

    renderRecommendation(
        "vaccinationContent",
        null
    );

    renderRecommendation(
        "exerciseContent",
        null
    );

    renderRecommendation("healthContent", null);

}


/* =========================================================
   RENDER RECOMMENDATION
========================================================= */

function renderRecommendation(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    /*
        No backend data yet.
        Do NOT create fake recommendations.
    */

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        element.innerHTML =
            `
                <p class="unavailable-text">
                    Information unavailable.
                </p>
            `;

        return;

    }


    /*
        If backend returns an array.
    */

    if (Array.isArray(value)) {

        element.innerHTML =
            `
                <ul>
                    ${
                        value
                            .map(function (item) {

                                return `
                                    <li>
                                        ${escapeHTML(
                                            String(item)
                                        )}
                                    </li>
                                `;

                            })
                            .join("")
                    }
                </ul>
            `;

        return;

    }


    /*
        If backend returns an object.
    */

    if (
        typeof value === "object"
    ) {

        element.innerHTML =
            renderObject(value);

        return;

    }


    /*
        Normal text.
    */

    element.innerHTML =
        `
            <p>
                ${escapeHTML(
                    String(value)
                )}
            </p>
        `;

}


/* =========================================================
   OBJECT DATA
========================================================= */

function renderObject(
    object
) {

    return Object.entries(
        object
    )
        .map(function ([key, value]) {

            if (
                value === undefined ||
                value === null ||
                value === ""
            ) {

                return "";

            }


            const label =
                formatLabel(key);


            if (Array.isArray(value)) {

                return `
                    <div class="recommendation-item">

                        <strong>
                            ${escapeHTML(label)}
                        </strong>

                        <ul>
                            ${
                                value
                                    .map(function (item) {

                                        return `
                                            <li>
                                                ${escapeHTML(
                                                    String(item)
                                                )}
                                            </li>
                                        `;

                                    })
                                    .join("")
                            }
                        </ul>

                    </div>
                `;

            }


            return `
                <div class="recommendation-item">

                    <strong>
                        ${escapeHTML(label)}
                    </strong>

                    <p>
                        ${escapeHTML(
                            String(value)
                        )}
                    </p>

                </div>
            `;

        })
        .join("");

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        element.textContent = "—";

        return;

    }


    element.textContent =
        value;

}


/* =========================================================
   FORMAT LABEL
========================================================= */

function formatLabel(
    value
) {

    return String(value)
        .replace(
            /([A-Z])/g,
            " $1"
        )
        .replace(
            /^./,
            function (character) {

                return character.toUpperCase();

            }
        );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}