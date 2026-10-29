document.addEventListener("DOMContentLoaded", () => {

    /* A new visit starts with no pet selected. */
    sessionStorage.removeItem("vetvisionPetId");

    const section = document.getElementById("animalUploadSection");
    const cards = document.querySelectorAll(".animal-card");

    if (!section || cards.length === 0) return;

    const base = (window.VETVISION_API_BASE_URL || "").replace(/\/$/, "");

    let pets = null;

    const box = document.createElement("div");
    box.className = "pet-picker";
    section.insertBefore(box, section.firstChild);

    cards.forEach(card => {
        card.addEventListener("click", () => {
            sessionStorage.removeItem("vetvisionPetId");
            showPicker(card.dataset.animal);
        });
    });

    async function loadPets() {

        if (pets !== null) return pets;

        try {

            const response = await fetch(base + "/api/pets", { credentials: "include" });

            if (!response.ok) throw new Error("Pets unavailable.");

            const data = await response.json();

            pets = Array.isArray(data.pets) ? data.pets : [];

        } catch (error) {

            console.error("Pet picker error:", error);
            pets = [];
        }

        return pets;
    }

    async function showPicker(animal) {

        const all = await loadPets();

        const matching = all.filter(pet => pet.animal === animal);

        box.innerHTML = "";

        if (matching.length === 0) {

            const hint = document.createElement("div");
            hint.className = "pet-picker-hint";
            hint.innerHTML =
                'No saved ' + animal + ' yet. <a href="pets.html">Add a pet</a> ' +
                'to track its scans over time.';

            box.appendChild(hint);
            return;
        }

        const label = document.createElement("label");
        label.textContent = "Which pet is this? (optional)";

        const select = document.createElement("select");

        const none = document.createElement("option");
        none.value = "";
        none.textContent = "No pet - just this scan";
        select.appendChild(none);

        matching.forEach(pet => {
            const option = document.createElement("option");
            option.value = pet.id;
            option.textContent = pet.name;
            select.appendChild(option);
        });

        select.addEventListener("change", () => {

            if (select.value) {
                sessionStorage.setItem("vetvisionPetId", select.value);
            } else {
                sessionStorage.removeItem("vetvisionPetId");
            }
        });

        box.appendChild(label);
        box.appendChild(select);
    }
});