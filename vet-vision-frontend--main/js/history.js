document.addEventListener("DOMContentLoaded", () => {
    const historyList = document.getElementById("historyList");
    const historyEmpty = document.getElementById("historyEmpty");
    const historyError = document.getElementById("historyError");
    const historySearch = document.getElementById("historySearch");
    const filterButtons = document.querySelectorAll(".history-filter");

    let historyRecords = [];
    let currentFilter = "all";
    let currentAnimal = "all";
    let currentSearch = "";
    let animalSelect = null;

    const ANIMAL_ICONS = { dog: "🐶", cat: "🐱", cattle: "🐄" };

    buildAnimalFilter();
    loadHistory();

    // ---------------------------------------
    // ANIMAL FILTER (added by JS, no HTML change)
    // ---------------------------------------

    function buildAnimalFilter() {
        if (!historySearch || !historySearch.parentNode) return;

        const right = document.createElement("div");
        right.className = "history-toolbar-right";

        animalSelect = document.createElement("select");
        animalSelect.className = "history-animal-filter";
        animalSelect.innerHTML = '<option value="all">All animals</option>';

        animalSelect.addEventListener("change", () => {
            currentAnimal = animalSelect.value;
            renderHistory();
        });

        historySearch.parentNode.insertBefore(right, historySearch);
        right.appendChild(animalSelect);
        right.appendChild(historySearch);
    }

    function refreshAnimalOptions() {
        if (!animalSelect) return;

        const animals = Array.from(
            new Set(
                historyRecords
                    .map(r => String(r.animal || "").toLowerCase())
                    .filter(Boolean)
            )
        ).sort();

        animalSelect.innerHTML = '<option value="all">All animals</option>';

        animals.forEach(a => {
            const option = document.createElement("option");
            option.value = a;
            option.textContent = capitalize(a);
            animalSelect.appendChild(option);
        });

        animalSelect.value = animals.includes(currentAnimal) ? currentAnimal : "all";
        currentAnimal = animalSelect.value;
    }

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

            if (Array.isArray(data)) {
                historyRecords = data;
            } else if (Array.isArray(data.entries)) {
                historyRecords = data.entries;
            } else if (Array.isArray(data.history)) {
                historyRecords = data.history;
            } else if (Array.isArray(data.records)) {
                historyRecords = data.records;
            } else if (Array.isArray(data.historyRecords)) {
                historyRecords = data.historyRecords;
            } else {
                historyRecords = [];
            }

            refreshAnimalOptions();
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

            if (currentFilter !== "all" && type !== currentFilter) {
                return false;
            }

            if (
                currentAnimal !== "all" &&
                String(record.animal || "").toLowerCase() !== currentAnimal
            ) {
                return false;
            }

            if (currentSearch) {

                const searchableText = [
                    record.animal,
                    record.breed,
                    record.disease,
                    type === "breed" ? "breed detection" : "disease detection",
                    formatDate(record.createdAt)
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

        if (filteredRecords.length === 0) {

            if (historyEmpty) {
                historyEmpty.style.display = "block";

                const emptyTitle = historyEmpty.querySelector("h3");
                const emptyText = historyEmpty.querySelector("p");

                if (historyRecords.length === 0) {
                    if (emptyTitle) emptyTitle.textContent = "No history available";
                    if (emptyText) emptyText.textContent =
                        "Your completed analyses will appear here.";
                } else {
                    if (emptyTitle) emptyTitle.textContent = "No matching records";
                    if (emptyText) emptyText.textContent =
                        "Try changing the filter or search term.";
                }
            }

            return;
        }

        if (historyEmpty) {
            historyEmpty.style.display = "none";
        }

        // Group by date label, keeping newest first.
        const groups = new Map();

        filteredRecords.forEach(record => {
            const label = getGroupLabel(record.createdAt);
            if (!groups.has(label)) groups.set(label, []);
            groups.get(label).push(record);
        });

        groups.forEach((records, label) => {

            const section = document.createElement("section");
            section.className = "history-group";

            const heading = document.createElement("h2");
            heading.className = "history-group-title";
            heading.textContent = label;

            const grid = document.createElement("div");
            grid.className = "history-grid";

            records.forEach(record => {
                grid.appendChild(createHistoryCard(record));
            });

            section.appendChild(heading);
            section.appendChild(grid);
            historyList.appendChild(section);
        });
    }

    // ---------------------------------------
    // CREATE HISTORY CARD
    // ---------------------------------------

    function createHistoryCard(record) {

        const type = getRecordType(record);
        const animal = String(record.animal || "").toLowerCase();

        const card = document.createElement("div");
        card.className = "history-card";
        card.dataset.type = type;

        // IMAGE
        const imageBox = document.createElement("div");
        imageBox.className = "history-card-image";

        const placeholder = document.createElement("span");
        placeholder.className = "history-card-placeholder";
        placeholder.textContent = ANIMAL_ICONS[animal] || "🐾";
        imageBox.appendChild(placeholder);

        if (record.imageUrl) {
            const image = document.createElement("img");
            image.src = record.imageUrl;
            image.alt = "Analysis image";
            image.onerror = () => image.remove();
            imageBox.appendChild(image);
        }

        const badge = document.createElement("span");
        badge.className = "history-card-badge " + type;
        badge.textContent = type === "breed" ? "Breed" : "Disease";
        imageBox.appendChild(badge);

        // BODY
        const body = document.createElement("div");
        body.className = "history-card-body";

        const title = document.createElement("h3");
        title.className = "history-card-title";
        title.textContent = getRecordTitle(record, type);

        const meta = document.createElement("div");
        meta.className = "history-card-meta";

        if (animal) {
            const chip = document.createElement("span");
            chip.className = "history-chip";
            chip.textContent = capitalize(animal);
            meta.appendChild(chip);
        }

        const confidence = getConfidence(record, type);
        if (confidence) {
            const conf = document.createElement("span");
            conf.className = "history-chip history-chip-confidence";
            conf.textContent = confidence + " confidence";
            meta.appendChild(conf);
        }

        const date = document.createElement("div");
        date.className = "history-card-date";
        date.textContent = formatDate(record.createdAt);

        body.appendChild(title);
        body.appendChild(meta);
        body.appendChild(date);

        // ACTIONS
        const actions = document.createElement("div");
        actions.className = "history-card-actions";

        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.className = "history-view";
        viewButton.textContent = "View";
        viewButton.addEventListener("click", event => {
            event.stopPropagation();
            openHistoryRecord(record, type);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "history-delete";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", async event => {
            event.stopPropagation();

            if (!confirm("Delete this entry?")) return;

            try {
                const base = window.VETVISION_API_BASE_URL || "";
                const response = await fetch(
                    `${base}/api/history/${encodeURIComponent(record.id)}`,
                    { method: "DELETE", credentials: "include" }
                );

                if (!response.ok) throw new Error("Delete failed.");

                historyRecords = historyRecords.filter(r => r.id !== record.id);
                refreshAnimalOptions();
                renderHistory();

            } catch (error) {
                alert("Could not delete this entry.");
            }
        });

        actions.appendChild(viewButton);
        actions.appendChild(deleteButton);

        card.addEventListener("click", () => {
            openHistoryRecord(record, type);
        });

        card.appendChild(imageBox);
        card.appendChild(body);
        card.appendChild(actions);

        return card;
    }

    // ---------------------------------------
    // HELPERS
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

        if (rawType.includes("disease")) return "disease";
        if (rawType.includes("breed")) return "breed";
        if (record.disease) return "disease";
        if (record.breed) return "breed";

        return "breed";
    }

    function getRecordTitle(record, type) {

        if (type === "breed") {
            return record.breed || "Breed Detection";
        }

        return record.disease || "Disease Detection";
    }

    function getConfidence(record, type) {

        const value = Number(
            type === "breed" ? record.breedConfidence : record.diseaseConfidence
        );

        if (!Number.isFinite(value)) return "";

        const percent = value <= 1 ? value * 100 : value;

        return percent.toFixed(1) + "%";
    }

    function capitalize(text) {
        text = String(text || "");
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    function getGroupLabel(value) {

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "Earlier";

        const now = new Date();

        const startOfToday = new Date(
            now.getFullYear(), now.getMonth(), now.getDate()
        );

        const startOfEntry = new Date(
            date.getFullYear(), date.getMonth(), date.getDate()
        );

        const days = Math.round((startOfToday - startOfEntry) / 86400000);

        if (days <= 0) return "Today";
        if (days === 1) return "Yesterday";
        if (days < 7) return "This week";

        return "Earlier";
    }

    function openHistoryRecord(record, type) {

        if (!record.result) {
            console.error("History record has no saved result:", record);
            return;
        }

        const data = Object.assign({}, record.result, {
            imageUrl: record.imageUrl || "",
            savedAt: Date.now()
        });

        sessionStorage.setItem("vetvisionDetectionResult", JSON.stringify(data));

        sessionStorage.setItem(
            type === "breed" ? "vetvisionBreedResult" : "vetvisionDiseaseResult",
            JSON.stringify(data)
        );

        window.location.href =
            type === "breed" ? "breed-result.html" : "disease-result.html";
    }

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