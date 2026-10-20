document.addEventListener("DOMContentLoaded", () => {
    const historyList = document.getElementById("historyList");
    const historyEmpty = document.getElementById("historyEmpty");
    const historyError = document.getElementById("historyError");
    const historySearch = document.getElementById("historySearch");
    const filterButtons = document.querySelectorAll(".history-filter");

    let historyRecords = [];
    let currentFilter = "all";
    let currentSearch = "";

    loadHistory();

    // ---------------------------------------
    // LOAD HISTORY FROM BACKEND
    // ---------------------------------------

    async function loadHistory() {
        showLoading();

        const baseURL = window.VETVISION_API_BASE_URL || "";

        try {
            const response = await fetch(`${baseURL}/api/history`, {
                method: "GET",
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error("Unable to load history.");
            }

            const data = await response.json();

            /*
             * Backend may return:
             * [
             *   {...},
             *   {...}
             * ]
             *
             * OR:
             * {
             *   history: [...]
             * }
             *
             * OR:
             * {
             *   records: [...]
             * }
             */
            if (Array.isArray(data)) {
                historyRecords = data;
            } else if (Array.isArray(data.history)) {
                historyRecords = data.history;
            } else if (Array.isArray(data.records)) {
                historyRecords = data.records;
            } else if (Array.isArray(data.historyRecords)) {
                historyRecords = data.historyRecords;
            } else {
                historyRecords = [];
            }

            renderHistory();

        } catch (error) {
            console.error("History loading error:", error);

            historyRecords = [];

            if (historyList) {
                historyList.innerHTML = "";
            }

            if (historyEmpty) {
                historyEmpty.style.display = "none";
            }

            if (historyError) {
                historyError.style.display = "block";
                historyError.textContent =
                    "History is not available yet. Please connect the backend and try again.";
            }
        }
    }

    // ---------------------------------------
    // FILTER BUTTONS
    // ---------------------------------------

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {

            filterButtons.forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            currentFilter = button.dataset.filter || "all";

            renderHistory();
        });
    });

    // ---------------------------------------
    // SEARCH
    // ---------------------------------------

    if (historySearch) {
        historySearch.addEventListener("input", () => {
            currentSearch = historySearch.value.trim().toLowerCase();

            renderHistory();
        });
    }

    // ---------------------------------------
    // RENDER HISTORY
    // ---------------------------------------

    function renderHistory() {

        if (!historyList) return;

        historyList.innerHTML = "";

        if (historyError) {
            historyError.style.display = "none";
        }

        const filteredRecords = historyRecords.filter(record => {

            const type = getRecordType(record);

            // Filter by detection type
            if (currentFilter !== "all" && type !== currentFilter) {
                return false;
            }

            // Search
            if (currentSearch) {

                const searchableText = [
                    record.animalType,
                    record.animal,
                    record.breed,
                    record.disease,
                    record.result,
                    record.analysisType,
                    record.detectionType,
                    record.type,
                    formatDate(record.createdAt),
                    formatDate(record.date)
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                if (!searchableText.includes(currentSearch)) {
                    return false;
                }
            }

            return true;
        });

        // No records
        if (filteredRecords.length === 0) {

            if (historyEmpty) {
                historyEmpty.style.display = "block";

                const emptyTitle =
                    historyEmpty.querySelector("h3");

                const emptyText =
                    historyEmpty.querySelector("p");

                if (historyRecords.length === 0) {
                    if (emptyTitle) {
                        emptyTitle.textContent = "No history available";
                    }

                    if (emptyText) {
                        emptyText.textContent =
                            "Your completed analyses will appear here.";
                    }
                } else {
                    if (emptyTitle) {
                        emptyTitle.textContent = "No matching records";
                    }

                    if (emptyText) {
                        emptyText.textContent =
                            "Try changing the filter or search term.";
                    }
                }
            }

            return;
        }

        if (historyEmpty) {
            historyEmpty.style.display = "none";
        }

        filteredRecords.forEach(record => {
            const item = createHistoryItem(record);
            historyList.appendChild(item);
        });
    }

    // ---------------------------------------
    // CREATE HISTORY ITEM
    // ---------------------------------------

    function createHistoryItem(record) {

        const item = document.createElement("div");

        item.className = "history-item";

        const type = getRecordType(record);

        item.dataset.type = type;

        // -----------------------------------
        // IMAGE
        // -----------------------------------

        const imageContainer =
            document.createElement("div");

        imageContainer.className = "history-image";

        if (record.imageUrl) {

            const image =
                document.createElement("img");

            image.src = record.imageUrl;
            image.alt = "Analysis image";

            image.onerror = () => {
                imageContainer.innerHTML = "";
            };

            imageContainer.appendChild(image);
        }

        // -----------------------------------
        // INFO
        // -----------------------------------

        const info =
            document.createElement("div");

        info.className = "history-info";

        // Detection type
        const typeLabel =
            document.createElement("span");

        typeLabel.className = "history-type";

        typeLabel.textContent =
            type === "breed"
                ? "Breed Detection"
                : "Disease Detection";

        // Result title
        const title =
            document.createElement("h3");

        title.className = "history-title";

        title.textContent =
            getRecordTitle(record, type);

        // Date
        const date =
            document.createElement("div");

        date.className = "history-date";

        date.textContent =
            formatDate(
                record.createdAt ||
                record.date ||
                record.timestamp
            );

        info.appendChild(typeLabel);
        info.appendChild(title);
        info.appendChild(date);

        // -----------------------------------
        // VIEW BUTTON
        // -----------------------------------

        const viewButton =
            document.createElement("button");

        viewButton.type = "button";
        viewButton.className = "history-view";
        viewButton.textContent = "View";

        viewButton.addEventListener("click", event => {
            event.stopPropagation();
            openHistoryRecord(record, type);
        });

        // -----------------------------------
        // WHOLE CARD CLICK
        // -----------------------------------

        item.addEventListener("click", () => {
            openHistoryRecord(record, type);
        });

        item.appendChild(imageContainer);
        item.appendChild(info);
        item.appendChild(viewButton);

        return item;
    }

    // ---------------------------------------
    // DETERMINE RECORD TYPE
    // ---------------------------------------

    function getRecordType(record) {

        const rawType = String(
            record.detectionType ||
            record.analysisType ||
            record.type ||
            record.detection_type ||
            record.analysis_type ||
            ""
        ).toLowerCase();

        // Explicit disease indicators
        if (
            rawType.includes("disease") ||
            record.disease !== undefined
        ) {
            return "disease";
        }

        // Explicit breed indicators
        if (
            rawType.includes("breed") ||
            record.breed !== undefined
        ) {
            return "breed";
        }

        return "breed";
    }

    // ---------------------------------------
    // GET RESULT TITLE
    // ---------------------------------------

    function getRecordTitle(record, type) {

        if (type === "breed") {

            return (
                record.breed ||
                record.result ||
                "Breed Detection"
            );
        }

        return (
            record.disease ||
            record.result ||
            "Disease Detection"
        );
    }

    // ---------------------------------------
    // OPEN DETAIL PAGE
    // ---------------------------------------

    function openHistoryRecord(record, type) {

        /*
         * The backend should provide an ID.
         * We do not create fake IDs.
         */

        const id =
            record.id ||
            record._id ||
            record.historyId ||
            record.detectionId;

        if (!id) {
            console.error(
                "History record does not contain an ID:",
                record
            );

            return;
        }

        if (type === "breed") {

            window.location.href =
                `breed-history.html?id=${encodeURIComponent(id)}`;

        } else {

            window.location.href =
                `disease.html?id=${encodeURIComponent(id)}`;
        }
    }

    // ---------------------------------------
    // FORMAT DATE
    // ---------------------------------------

    function formatDate(value) {

        if (!value) {
            return "Date unavailable";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    // ---------------------------------------
    // LOADING STATE
    // ---------------------------------------

    function showLoading() {

        if (historyEmpty) {
            historyEmpty.style.display = "none";
        }

        if (historyError) {
            historyError.style.display = "none";
        }

        if (historyList) {

            historyList.innerHTML = `
                <div class="history-loading">
                    Loading history...
                </div>
            `;
        }
    }
});