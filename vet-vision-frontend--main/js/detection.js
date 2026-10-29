document.addEventListener("DOMContentLoaded", () => {

    const imageInput =
        document.getElementById("imageInput");

    const chooseImageBtn =
        document.getElementById("chooseImageBtn");

    const changeImageBtn =
        document.getElementById("changeImageBtn");

    const imagePreview =
        document.getElementById("imagePreview");

    const previewContainer =
        document.getElementById("previewContainer");

    const uploadBox =
        document.getElementById("uploadBox");

    const uploadSection =
        document.getElementById("animalUploadSection");

    const uploadTitle =
        document.getElementById("uploadTitle");

    const uploadDescription =
        document.getElementById("uploadDescription");

    const analyzeBtn =
        document.getElementById("analyzeBtn");


    if (!imageInput) {
        return;
    }


    /* -----------------------------------------
       DETECTION TYPE
    ----------------------------------------- */

    const params =
        new URLSearchParams(window.location.search);

    const detectionType =
        params.get("mode") === "breed"
            ? "breed"
            : "disease";


    const currentPage =
        window.location.pathname
            .split("/")
            .pop();


    const isAnimalSelectionPage =
        currentPage === "animal-selection.html";


    let selectedAnimal = null;
    let selectedFile = null;


    /* =========================================
       ANIMAL SELECTION PAGE
       ========================================= */

    if (isAnimalSelectionPage) {

        const animalCards =
            document.querySelectorAll(".animal-card");


        animalCards.forEach(card => {

            card.addEventListener("click", () => {

                selectedAnimal =
                    card.dataset.animal;


                localStorage.setItem(
                    "selectedAnimal",
                    selectedAnimal
                );


                sessionStorage.setItem(
                    "vetvisionDetectionType",
                    detectionType
                );


                /* Selected card */

                animalCards.forEach(item => {

                    item.classList.remove(
                        "selected"
                    );

                });

                card.classList.add("selected");


                /* Show upload section */

                if (uploadSection) {

                    uploadSection.style.display =
                        "block";

                }


                /* Upload text */

                if (selectedAnimal === "dog") {

                    uploadTitle.textContent =
                        "Upload an image of your dog";

                    uploadDescription.textContent =
                        "Choose a clear image of the dog you want to analyze.";

                }

                else if (selectedAnimal === "cat") {

                    uploadTitle.textContent =
                        "Upload an image of your cat";

                    uploadDescription.textContent =
                        "Choose a clear image of the cat you want to analyze.";

                }

                else if (selectedAnimal === "cattle") {

                    uploadTitle.textContent =
                        "Upload an image of your cattle";

                    uploadDescription.textContent =
                        "Choose a clear image of the cattle you want to analyze.";

                }


                /* Reset previous image */

                selectedFile = null;

                imageInput.value = "";

                imagePreview.src = "";

                previewContainer.style.display =
                    "none";

                uploadBox.style.display =
                    "flex";

                analyzeBtn.disabled =
                    true;


                /* Open file picker immediately */

                imageInput.click();

            });

        });


        /* -----------------------------------------
           IMAGE SELECTED
        ----------------------------------------- */

        imageInput.addEventListener(
            "change",
            () => {

                const file =
                    imageInput.files?.[0];


                if (!file) {
                    return;
                }


                if (
                    !file.type.startsWith("image/")
                ) {

                    alert(
                        "Please select a valid image."
                    );

                    imageInput.value = "";

                    return;
                }


                selectedFile = file;


                /* Preview */

                imagePreview.src =
                    URL.createObjectURL(file);


                uploadBox.style.display =
                    "none";


                previewContainer.style.display =
                    "flex";


                analyzeBtn.disabled =
                    false;


                analyzeBtn.textContent =
                    "Analyze Image";

            }
        );


        /* -----------------------------------------
           CHOOSE IMAGE
        ----------------------------------------- */

        chooseImageBtn?.addEventListener(
            "click",
            () => {

                imageInput.click();

            }
        );


        /* -----------------------------------------
           CHANGE IMAGE
        ----------------------------------------- */

        changeImageBtn?.addEventListener(
            "click",
            () => {

                imageInput.click();

            }
        );


        /* -----------------------------------------
           ANALYZE
        ----------------------------------------- */

        analyzeBtn?.addEventListener(
            "click",
            async () => {

                if (!selectedAnimal) {
                    alert("Please select an animal first.");
                    return;
                }

                if (!selectedFile) {
                    alert("Please select an image first.");
                    return;
                }

                analyzeBtn.disabled = true;
                analyzeBtn.textContent = "Analyzing...";

                try {

                    /* Small copy of the photo, kept for display on the result pages. */
                    const imageData = await compressImage(selectedFile);

                    /* Send the photo to the backend model. */
                    const upload = await prepareUpload(selectedFile, imageData);
                    const result = await callBackend(detectionType, selectedAnimal, upload);
                    console.log("VetVision backend result:", result);

                    const resultData = buildResultData(
                        detectionType,
                        selectedAnimal,
                        imageData,
                        result
                    );

                    sessionStorage.setItem(
                        "vetvisionDetectionResult",
                        JSON.stringify(resultData)
                    );

                    if (detectionType === "breed") {
                        sessionStorage.setItem(
                            "vetvisionBreedResult",
                            JSON.stringify(resultData)
                        );
                    }
                    else {
                        sessionStorage.setItem(
                            "vetvisionDiseaseResult",
                            JSON.stringify(resultData)
                        );
                    }

                    await saveToHistory(detectionType, selectedAnimal, resultData);

                    goToResultPage(detectionType);

                }

                catch (error) {

                    console.error("VetVision Analyze Error:", error);

                    alert(
                        error.message ||
                        "Something went wrong. Please try again."
                    );

                    analyzeBtn.disabled = false;
                    analyzeBtn.textContent = "Analyze Image";

                }

            }
        );


        /*
         * Stop here.
         */

        return;
    }


    /* =========================================
       OLD SEPARATE DETECTION PAGES
       ========================================= */

    const selectedAnimalFromStorage =
        localStorage.getItem(
            "selectedAnimal"
        );


    if (!selectedAnimalFromStorage) {

        window.location.href =
            "animal-selection.html";

        return;
    }


    selectedAnimal =
        selectedAnimalFromStorage;


    /* Choose image */

    chooseImageBtn?.addEventListener(
        "click",
        () => {

            imageInput.click();

        }
    );


    /* Change image */

    changeImageBtn?.addEventListener(
        "click",
        () => {

            imageInput.click();

        }
    );


    /* Image selected */

    imageInput.addEventListener(
        "change",
        () => {

            const file =
                imageInput.files?.[0];


            if (!file) {
                return;
            }


            if (
                !file.type.startsWith("image/")
            ) {

                alert(
                    "Please select a valid image."
                );

                imageInput.value = "";

                return;
            }


            selectedFile = file;


            imagePreview.src =
                URL.createObjectURL(file);


            if (uploadBox) {

                uploadBox.style.display =
                    "none";

            }


            if (previewContainer) {

                previewContainer.style.display =
                    "flex";

            }


            if (analyzeBtn) {

                analyzeBtn.disabled =
                    false;

                analyzeBtn.textContent =
                    "Analyze Image";

            }

        }
    );

});


/* =========================================
   RESULT PAGE
   ========================================= */

function goToResultPage(
    detectionType
) {

    if (
        detectionType === "breed"
    ) {

        window.location.href =
            "breed-result.html";

    }

    else {

        window.location.href =
            "disease-result.html";

    }

}


/* =========================================
   COMPRESS IMAGE
   ========================================= */

function compressImage(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload = () => {

                const img =
                    new Image();


                img.onload = () => {

                    const MAX_SIZE = 1200;

                    let width =
                        img.width;

                    let height =
                        img.height;


                    /* Resize large images */

                    if (width > MAX_SIZE ||
                        height > MAX_SIZE) {

                        if (width > height) {

                            height =
                                Math.round(
                                    height *
                                    MAX_SIZE /
                                    width
                                );

                            width =
                                MAX_SIZE;

                        }

                        else {

                            width =
                                Math.round(
                                    width *
                                    MAX_SIZE /
                                    height
                                );

                            height =
                                MAX_SIZE;

                        }

                    }


                    const canvas =
                        document.createElement(
                            "canvas"
                        );


                    canvas.width =
                        width;

                    canvas.height =
                        height;


                    const context =
                        canvas.getContext(
                            "2d"
                        );


                    context.drawImage(
                        img,
                        0,
                        0,
                        width,
                        height
                    );


                    /*
                     * JPEG quality 0.75 keeps
                     * the image clear while
                     * greatly reducing size.
                     */

                    const compressed =
                        canvas.toDataURL(
                            "image/jpeg",
                            0.75
                        );


                    resolve(
                        compressed
                    );

                };


                img.onerror = () => {

                    reject(
                        new Error(
                            "Unable to process image."
                        )
                    );

                };


                img.src =
                    reader.result;

            };


            reader.onerror = () => {

                reject(
                    new Error(
                        "Unable to read image."
                    )
                );

            };


            reader.readAsDataURL(file);

        }
    );

}


/* =========================================
   BACKEND CALL
   ========================================= */

const MAX_DIRECT_UPLOAD_BYTES = 8 * 1024 * 1024;   /* backend limit is 10 MB */


function getApiBase() {

    return (window.VETVISION_API_BASE_URL || "")
        .replace(/\/$/, "");

}


/* Send the original photo when it is small enough, otherwise the compressed copy. */

async function prepareUpload(file, compressedDataUrl) {

    if (file.size <= MAX_DIRECT_UPLOAD_BYTES) {
        return file;
    }

    const response = await fetch(compressedDataUrl);

    return await response.blob();

}


async function callBackend(detectionType, animal, upload) {

    const endpoint =
        detectionType === "breed"
            ? "/api/detect-breed"
            : "/api/detect-disease";

    const form = new FormData();

    form.append("image", upload, "photo.jpg");
    form.append("animal", animal);

    let response;

    try {

        response = await fetch(
            getApiBase() + endpoint,
            { method: "POST", body: form }
        );

    }

    catch (error) {

        throw new Error(
            "Cannot reach the VetVision backend. " +
            "Make sure it is running (python backend/server.py)."
        );

    }

    let data = null;

    try {
        data = await response.json();
    }
    catch (error) {
        data = null;
    }

    if (!response.ok) {

        throw new Error(
            (data && data.error) ||
            `The backend returned an error (${response.status}).`
        );

    }

    return data;

}


function prettyLabel(text) {

    return String(text || "")
        .replace(/[_-]+/g, " ")
        .trim()
        .replace(/\b\w/g, c => c.toUpperCase());

}


function buildResultData(detectionType, animal, imageUrl, result) {

    const base = {

        detectionType: detectionType,
        animalType: animal,
        imageUrl: imageUrl,
        status: "success",
        confidence: (result.confidence * 100).toFixed(1) + "%",
        confidenceValue: result.confidence,
        lowConfidence: !!result.low_confidence,
        top3: result.top3 || [],
        savedAt: Date.now()

    };

    if (detectionType === "breed") {

        return Object.assign(base, {

            breed: result.breed_display || prettyLabel(result.breed),
            breedRaw: result.breed,
            animalMismatch: !!result.animal_mismatch,
            modelThinksAnimal: result.model_thinks_animal || ""

        });

    }

    return Object.assign(base, {

        disease: result.disease,
        diseaseDisplay: prettyLabel(result.disease)

    });

}


/* =========================================
   SAVE TO HISTORY
   ========================================= */

function makeThumbnail(dataUrl) {

    return new Promise(resolve => {

        const img = new Image();

        img.onload = () => {

            const MAX = 400;
            const scale = Math.min(1, MAX / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");

            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);

            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

            resolve(canvas.toDataURL("image/jpeg", 0.6));

        };

        img.onerror = () => resolve("");

        img.src = dataUrl;

    });

}


/* Never blocks or breaks detection: if saving fails, the result page still opens. */

async function saveToHistory(detectionType, animal, resultData) {

    const base =
        (window.VETVISION_API_BASE_URL ||
            "http://" + (window.location.hostname || "127.0.0.1") + ":5000")
            .replace(/\/$/, "");

    try {

        const thumbnail = await makeThumbnail(resultData.imageUrl);

        const stored = Object.assign({}, resultData);
        delete stored.imageUrl;

        const entry = {
            type: detectionType,
            animal: animal,
            imageUrl: thumbnail,
            result: stored
        };

        if (detectionType === "breed") {
            entry.breed = resultData.breed;
            entry.breedConfidence = resultData.confidenceValue;
        } else {
            entry.disease = resultData.diseaseDisplay;
            entry.diseaseConfidence = resultData.confidenceValue;
        }

        const petId = sessionStorage.getItem("vetvisionPetId");

        if (petId) {
            entry.petId = petId;
        }

        const response = await fetch(base + "/api/history", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry)
        });

        if (!response.ok) {

            const body = await response.text();

            console.error(
                "VetVision: history save failed (" + response.status + "):",
                body
            );

        }

    }

    catch (error) {

        console.error("VetVision: could not save to history.", error);

    }

}