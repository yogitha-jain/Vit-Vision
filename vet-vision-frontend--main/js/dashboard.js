document.addEventListener("DOMContentLoaded", () => {
    const statTotal = document.getElementById("statTotal");
    const statBreed = document.getElementById("statBreed");
    const statDisease = document.getElementById("statDisease");
    const statAnimal = document.getElementById("statAnimal");
    const recentScans = document.getElementById("recentScans");

    const ANIMAL_ICONS = { dog: "🐶", cat: "🐱", cattle: "🐄" };

    loadDashboard();

    async function loadDashboard() {
        const baseURL = window.VETVISION_API_BASE_URL || "";

        try {
            const response = await fetch(`${baseURL}/api/history`, {
                method: "GET",
                credentials: "include"
            });

            if (!response.ok) throw new Error("Unable to load history.");

            const data = await response.json();

            let records = [];
            if (Array.isArray(data)) records = data;
            else if (Array.isArray(data.entries)) records = data.entries;
            else if (Array.isArray(data.history)) records = data.history;
            else if (Array.isArray(data.records)) records = data.records;
            else if (Array.isArray(data.historyRecords)) records = data.historyRecords;

            renderStats(records);
            renderRecent(records);

        } catch (error) {
            console.error("Dashboard loading error:", error);
            showMessage("Recent scans are not available right now.");
        }
    }

    function renderStats(records) {
        let breed = 0;
        let disease = 0;
        const animalCount = {};

        records.forEach(record => {
            if (getRecordType(record) === "breed") breed++;
            else disease++;

            const animal = String(record.animal || "").toLowerCase();
            if (animal) animalCount[animal] = (animalCount[animal] || 0) + 1;
        });

        statTotal.textContent = records.length;
        statBreed.textContent = breed;
        statDisease.textContent = disease;

        const top = Object.keys(animalCount).sort(
            (a, b) => animalCount[b] - animalCount[a]
        )[0];

        statAnimal.textContent = top ? capitalize(top) : "–";
    }

    function renderRecent(records) {
        recentScans.innerHTML = "";

        if (records.length === 0) {
            showMessage("No scans yet. Your recent analyses will appear here.");
            return;
        }

        const latest = records
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 4);

        latest.forEach(record => recentScans.appendChild(createCard(record)));
    }

    function createCard(record) {
        const type = getRecordType(record);
        const animal = String(record.animal || "").toLowerCase();

        const card = document.createElement("button");
        card.type = "button";
        card.className = "recent-card";
        card.addEventListener("click", () => openRecord(record, type));

        const imageBox = document.createElement("div");
        imageBox.className = "recent-image";
        imageBox.textContent = ANIMAL_ICONS[animal] || "🐾";

        if (record.imageUrl) {
            const image = document.createElement("img");
            image.src = record.imageUrl;
            image.alt = "Scan image";
            image.onerror = () => image.remove();
            imageBox.appendChild(image);
        }

        const body = document.createElement("div");
        body.className = "recent-body";

        const title = document.createElement("strong");
        title.textContent = type === "breed"
            ? (record.breed || "Breed Detection")
            : (record.disease || "Disease Detection");

        const meta = document.createElement("span");
        meta.textContent = (animal ? capitalize(animal) + " · " : "") +
            (type === "breed" ? "Breed" : "Disease");

        const date = document.createElement("span");
        date.className = "recent-date";
        date.textContent = formatDate(record.createdAt);

        body.appendChild(title);
        body.appendChild(meta);
        body.appendChild(date);

        card.appendChild(imageBox);
        card.appendChild(body);

        return card;
    }

    function openRecord(record, type) {
        if (!record.result) return;

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

    function showMessage(text) {
        recentScans.innerHTML = "";
        const message = document.createElement("div");
        message.className = "recent-message";
        message.textContent = text;
        recentScans.appendChild(message);
    }

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
        return "breed";
    }

    function capitalize(text) {
        text = String(text || "");
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    function formatDate(value) {
        if (!value) return "Date unavailable";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }
});