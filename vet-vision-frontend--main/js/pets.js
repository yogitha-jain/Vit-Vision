document.addEventListener("DOMContentLoaded", () => {

    const base = (window.VETVISION_API_BASE_URL || "").replace(/\/$/, "");

    const ANIMAL_ICONS = { dog: "🐶", cat: "🐱", cattle: "🐄" };

    const petForm = document.getElementById("petForm");
    const petName = document.getElementById("petName");
    const petAnimal = document.getElementById("petAnimal");
    const petBreed = document.getElementById("petBreed");
    const petAge = document.getElementById("petAge");
    const petPhoto = document.getElementById("petPhoto");
    const petSubmit = document.getElementById("petSubmit");
    const petFormMessage = document.getElementById("petFormMessage");
    const petsGrid = document.getElementById("petsGrid");

    const timelineSection = document.getElementById("timelineSection");
    const timelineTitle = document.getElementById("timelineTitle");
    const timelineSummary = document.getElementById("timelineSummary");
    const timelineList = document.getElementById("timelineList");
    const timelineClose = document.getElementById("timelineClose");

    let pets = [];

    loadPets();

    // ---------------------------------------
    // LOAD + RENDER PETS
    // ---------------------------------------

    async function loadPets() {

        try {

            const response = await fetch(base + "/api/pets", { credentials: "include" });

            if (!response.ok) throw new Error("Unable to load pets.");

            const data = await response.json();

            pets = Array.isArray(data.pets) ? data.pets : [];

            renderPets();

        } catch (error) {

            console.error("Pets loading error:", error);
            showGridMessage("Your pets could not be loaded. Check that the backend is running.");
        }
    }

    function renderPets() {

        petsGrid.innerHTML = "";

        if (pets.length === 0) {
            showGridMessage("No pets yet. Add your first pet above.");
            return;
        }

        pets.forEach(pet => petsGrid.appendChild(createPetCard(pet)));
    }

    function createPetCard(pet) {

        const card = document.createElement("div");
        card.className = "pet-card";

        const photoBox = document.createElement("div");
        photoBox.className = "pet-card-photo";

        const placeholder = document.createElement("span");
        placeholder.textContent = ANIMAL_ICONS[pet.animal] || "🐾";
        photoBox.appendChild(placeholder);

        if (pet.photo) {
            const image = document.createElement("img");
            image.src = pet.photo;
            image.alt = pet.name;
            image.onerror = () => image.remove();
            photoBox.appendChild(image);
        }

        const body = document.createElement("div");
        body.className = "pet-card-body";

        const name = document.createElement("h3");
        name.textContent = pet.name;

        const meta = document.createElement("div");
        meta.className = "pet-card-meta";

        [capitalize(pet.animal), pet.breed, capitalize(pet.ageGroup)]
            .filter(Boolean)
            .forEach(text => {
                const chip = document.createElement("span");
                chip.className = "pet-chip";
                chip.textContent = text;
                meta.appendChild(chip);
            });

        const scans = document.createElement("div");
        scans.className = "pet-card-scans";
        scans.textContent =
            pet.scanCount + (pet.scanCount === 1 ? " scan" : " scans");

        body.appendChild(name);
        body.appendChild(meta);
        body.appendChild(scans);

        const actions = document.createElement("div");
        actions.className = "pet-card-actions";

        const timelineButton = document.createElement("button");
        timelineButton.type = "button";
        timelineButton.className = "pet-timeline-btn";
        timelineButton.textContent = "Timeline";
        timelineButton.addEventListener("click", () => openTimeline(pet));

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "pet-delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deletePet(pet));

        actions.appendChild(timelineButton);
        actions.appendChild(deleteButton);

        card.appendChild(photoBox);
        card.appendChild(body);
        card.appendChild(actions);

        return card;
    }

    // ---------------------------------------
    // ADD PET
    // ---------------------------------------

    petForm.addEventListener("submit", async event => {

        event.preventDefault();

        const name = petName.value.trim();

        if (!name) {
            setFormMessage("Please enter a name.", true);
            return;
        }

        petSubmit.disabled = true;
        setFormMessage("Saving...", false);

        try {

            let photo = "";

            if (petPhoto.files && petPhoto.files[0]) {
                photo = await compressPhoto(petPhoto.files[0]);
            }

            const response = await fetch(base + "/api/pets", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name,
                    animal: petAnimal.value,
                    breed: petBreed.value.trim(),
                    ageGroup: petAge.value,
                    photo: photo
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || "Could not save the pet.");
            }

            petForm.reset();
            setFormMessage("Pet added.", false);

            await loadPets();

        } catch (error) {

            setFormMessage(error.message || "Could not save the pet.", true);
        }

        petSubmit.disabled = false;
    });

    // ---------------------------------------
    // DELETE PET
    // ---------------------------------------

    async function deletePet(pet) {

        if (!confirm("Delete " + pet.name + "? Their scans stay in History.")) return;

        try {

            const response = await fetch(
                base + "/api/pets/" + encodeURIComponent(pet.id),
                { method: "DELETE", credentials: "include" }
            );

            if (!response.ok) throw new Error("Delete failed.");

            timelineSection.style.display = "none";

            await loadPets();

        } catch (error) {
            alert("Could not delete this pet.");
        }
    }

    // ---------------------------------------
    // TIMELINE
    // ---------------------------------------

    timelineClose.addEventListener("click", () => {
        timelineSection.style.display = "none";
    });

    async function openTimeline(pet) {

        timelineSection.style.display = "block";
        timelineTitle.textContent = pet.name + "'s timeline";
        timelineSummary.textContent = "";
        timelineList.innerHTML = '<div class="pets-message">Loading...</div>';

        timelineSection.scrollIntoView({ behavior: "smooth", block: "start" });

        try {

            const response = await fetch(
                base + "/api/history?limit=100&petId=" + encodeURIComponent(pet.id),
                { credentials: "include" }
            );

            if (!response.ok) throw new Error("Unable to load the timeline.");

            const data = await response.json();
            const entries = Array.isArray(data.entries) ? data.entries : [];

            renderTimeline(entries);

        } catch (error) {

            console.error("Timeline error:", error);
            timelineList.innerHTML = "";
            timelineList.appendChild(makeMessage("The timeline could not be loaded."));
        }
    }

    function renderTimeline(entries) {

        timelineList.innerHTML = "";

        if (entries.length === 0) {
            timelineSummary.textContent = "";
            timelineList.appendChild(
                makeMessage("No scans yet. Pick this pet on the Animal Selection page before analyzing.")
            );
            return;
        }

        timelineSummary.textContent =
            entries.length + (entries.length === 1 ? " scan" : " scans") +
            " · latest on " + formatDate(entries[0].createdAt);

        entries.forEach(entry => timelineList.appendChild(createTimelineItem(entry)));
    }

    function createTimelineItem(entry) {

        const type = getType(entry);

        const item = document.createElement("button");
        item.type = "button";
        item.className = "timeline-item " + type;

        const dot = document.createElement("span");
        dot.className = "timeline-dot";

        const thumb = document.createElement("div");
        thumb.className = "timeline-thumb";

        if (entry.imageUrl) {
            const image = document.createElement("img");
            image.src = entry.imageUrl;
            image.alt = "Scan image";
            image.onerror = () => image.remove();
            thumb.appendChild(image);
        }

        const text = document.createElement("div");
        text.className = "timeline-text";

        const title = document.createElement("strong");
        title.textContent =
            type === "breed"
                ? (entry.breed || "Breed Detection")
                : (entry.disease || "Disease Detection");

        const meta = document.createElement("span");
        const confidence = getConfidence(entry, type);

        meta.textContent =
            (type === "breed" ? "Breed detection" : "Disease detection") +
            (confidence ? " · " + confidence + " confidence" : "");

        const date = document.createElement("span");
        date.className = "timeline-date";
        date.textContent = formatDate(entry.createdAt);

        text.appendChild(title);
        text.appendChild(meta);
        text.appendChild(date);

        item.appendChild(dot);
        item.appendChild(thumb);
        item.appendChild(text);

        item.addEventListener("click", () => openRecord(entry, type));

        return item;
    }

    function openRecord(entry, type) {

        if (!entry.result) {
            window.location.href = "history.html";
            return;
        }

        const data = Object.assign({}, entry.result, {
            imageUrl: entry.imageUrl || "",
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

    // ---------------------------------------
    // HELPERS
    // ---------------------------------------

    function compressPhoto(file) {

        return new Promise((resolve, reject) => {

            const reader = new FileReader();

            reader.onload = () => {

                const img = new Image();

                img.onload = () => {

                    const MAX = 320;
                    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
                    const canvas = document.createElement("canvas");

                    canvas.width = Math.round(img.width * scale);
                    canvas.height = Math.round(img.height * scale);

                    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

                    resolve(canvas.toDataURL("image/jpeg", 0.7));
                };

                img.onerror = () => reject(new Error("Could not read that photo."));

                img.src = reader.result;
            };

            reader.onerror = () => reject(new Error("Could not read that photo."));

            reader.readAsDataURL(file);
        });
    }

    function getType(entry) {

        const raw = String(entry.type || "").toLowerCase();

        if (raw.includes("disease")) return "disease";
        if (raw.includes("breed")) return "breed";
        if (entry.disease) return "disease";

        return "breed";
    }

    function getConfidence(entry, type) {

        const value = Number(
            type === "breed" ? entry.breedConfidence : entry.diseaseConfidence
        );

        if (!Number.isFinite(value)) return "";

        return (value <= 1 ? value * 100 : value).toFixed(1) + "%";
    }

    function setFormMessage(text, isError) {
        petFormMessage.textContent = text;
        petFormMessage.className =
            "pet-form-message" + (isError ? " error" : "");
    }

    function makeMessage(text) {
        const message = document.createElement("div");
        message.className = "pets-message";
        message.textContent = text;
        return message;
    }

    function showGridMessage(text) {
        petsGrid.innerHTML = "";
        petsGrid.appendChild(makeMessage(text));
    }

    function capitalize(text) {
        text = String(text || "");
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    function formatDate(value) {

        const date = new Date(value);

        if (!value || Number.isNaN(date.getTime())) return "";

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }
});