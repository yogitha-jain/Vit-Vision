
import re


def normalize_name(value):
    """Normalize breed names, including underscores and hyphens."""
    return re.sub(r"[^a-z0-9]", "", str(value).lower())


# Breed-specific care guidance for all 30 supported breeds.
# Recommendations are general guidance, not veterinary prescriptions.
BREED_CARE = {
    # DOG BREEDS
    "beagle": {
        "animal": "dog",
        "grooming": "Brush weekly; check ears regularly and keep nails trimmed.",
        "activity": "Provide daily walks, sniffing games, and supervised play.",
        "health": "Monitor body weight and ear health; beagles can be prone to weight gain."
    },
    "boxer": {
        "animal": "dog",
        "grooming": "Brush the short coat weekly and clean facial folds when needed.",
        "activity": "Provide daily play and exercise; avoid strenuous activity in hot weather.",
        "health": "Monitor breathing, heart health, and body condition with veterinary checkups."
    },
    "germanshepherd": {
        "animal": "dog",
        "grooming": "Brush several times weekly, especially during shedding seasons.",
        "activity": "Provide daily walks, training, and mentally stimulating activities.",
        "health": "Maintain a healthy weight and discuss hip and joint health with a veterinarian."
    },
    "goldenretriever": {
        "animal": "dog",
        "grooming": "Brush several times weekly and check ears after swimming or bathing.",
        "activity": "Provide daily walks, retrieving games, and supervised swimming if suitable.",
        "health": "Monitor weight, skin, ears, and joint health."
    },
    "labradorretriever": {
        "animal": "dog",
        "grooming": "Brush weekly and check ears and nails regularly.",
        "activity": "Provide daily walks, play, and food-puzzle activities.",
        "health": "Measure food portions and monitor weight and joint health."
    },
    "pomeranian": {
        "animal": "dog",
        "grooming": "Brush the double coat regularly and maintain dental hygiene.",
        "activity": "Provide short daily walks and indoor play suitable for a small dog.",
        "health": "Monitor dental health, breathing, and kneecap mobility."
    },
    "pug": {
        "animal": "dog",
        "grooming": "Brush regularly and gently clean and dry facial folds.",
        "activity": "Use gentle walks and indoor play; avoid overheating and strenuous exercise.",
        "health": "Pay close attention to breathing and heat tolerance; seek veterinary advice for breathing difficulty."
    },
    "rottweiler": {
        "animal": "dog",
        "grooming": "Brush weekly and check ears, teeth, and nails.",
        "activity": "Provide regular controlled exercise, training, and mental enrichment.",
        "health": "Maintain a healthy weight and discuss joint and heart health with a veterinarian."
    },
    "shihtzu": {
        "animal": "dog",
        "grooming": "Brush frequently; keep the coat, face, and eye area clean.",
        "activity": "Provide short walks and indoor play suited to the dog's condition.",
        "health": "Monitor eye health, dental hygiene, and breathing."
    },
    "siberianhusky": {
        "animal": "dog",
        "grooming": "Brush several times weekly and more often during heavy shedding.",
        "activity": "Provide regular exercise and enrichment in a secure area.",
        "health": "Provide shade and water in hot weather and monitor eye and joint health."
    },

    # CAT BREEDS
    "bengal": {
        "animal": "cat",
        "grooming": "Brush weekly and check ears, teeth, and nails.",
        "activity": "Provide interactive play, climbing spaces, and puzzle feeders.",
        "health": "Maintain a healthy weight and arrange routine veterinary checkups."
    },
    "britishshorthair": {
        "animal": "cat",
        "grooming": "Brush weekly and increase brushing during shedding periods.",
        "activity": "Encourage daily play and climbing at a comfortable pace.",
        "health": "Monitor weight and discuss heart health with a veterinarian."
    },
    "domesticshorthair": {
        "animal": "cat",
        "grooming": "Brush weekly or as needed and check skin and ears.",
        "activity": "Provide daily play, scratching posts, and climbing opportunities.",
        "health": "Monitor weight, dental health, and routine preventive care."
    },
    "himalayan": {
        "animal": "cat",
        "grooming": "Comb the long coat daily to prevent tangles; gently clean the face as needed.",
        "activity": "Provide gentle daily play and easy-to-reach resting places.",
        "health": "Monitor eyes, breathing, and coat condition; arrange regular veterinary checkups."
    },
    "mainecoon": {
        "animal": "cat",
        "grooming": "Comb the coat several times weekly and check for mats.",
        "activity": "Provide climbing structures, interactive toys, and regular play.",
        "health": "Discuss heart and joint screening with a veterinarian."
    },
    "persian": {
        "animal": "cat",
        "grooming": "Comb daily and gently clean the face and eye area when needed.",
        "activity": "Provide short, regular play sessions and a calm environment.",
        "health": "Monitor breathing, eyes, and kidney health with veterinary guidance."
    },
    "ragdoll": {
        "animal": "cat",
        "grooming": "Comb the coat several times weekly and check for tangles.",
        "activity": "Provide interactive play, scratching posts, and indoor enrichment.",
        "health": "Monitor weight and discuss heart health with a veterinarian."
    },
    "scottishfold": {
        "animal": "cat",
        "grooming": "Brush weekly and check ears gently without inserting objects into them.",
        "activity": "Offer gentle play and comfortable access to resting and climbing areas.",
        "health": "Seek veterinary guidance about joint pain or stiffness, which can be associated with this breed."
    },
    "siamese": {
        "animal": "cat",
        "grooming": "Brush weekly and maintain regular dental care.",
        "activity": "Provide daily interactive play, climbing, and social enrichment.",
        "health": "Monitor dental and respiratory health during routine veterinary visits."
    },
    "sphynx": {
        "animal": "cat",
        "grooming": "Gently clean the skin as advised by a veterinarian and check ears regularly.",
        "activity": "Provide indoor play and a comfortably warm environment.",
        "health": "Protect skin from excessive sun and cold; discuss heart screening with a veterinarian."
    },

    # CATTLE / BUFFALO BREEDS
    "amritmahal": {
        "animal": "cattle",
        "grooming": "Keep the coat, hooves, housing, and resting area clean.",
        "activity": "Provide suitable space for movement and breed-appropriate handling.",
        "health": "Monitor body condition, hooves, and signs of lameness."
    },
    "gir": {
        "animal": "cattle",
        "grooming": "Brush when needed and maintain clean housing and hoof care.",
        "activity": "Provide daily movement, shade, and comfortable resting space.",
        "health": "Monitor appetite, body condition, milk production where applicable, and parasite risks."
    },
    "hallikar": {
        "animal": "cattle",
        "grooming": "Maintain coat cleanliness, hoof care, and hygienic housing.",
        "activity": "Provide suitable space for daily movement and calm handling.",
        "health": "Monitor gait, appetite, hydration, and body condition."
    },
    "holsteinfriesian": {
        "animal": "cattle",
        "grooming": "Keep the coat and housing clean and maintain routine hoof care.",
        "activity": "Provide comfortable movement, shade, and heat-stress protection.",
        "health": "Monitor hydration, udder health where applicable, and body condition."
    },
    "jersey": {
        "animal": "cattle",
        "grooming": "Keep the coat clean and provide regular hoof and housing care.",
        "activity": "Provide comfortable movement, shade, and fresh water.",
        "health": "Monitor body condition, hydration, and production-related health needs."
    },
    "kasargod": {
        "animal": "cattle",
        "grooming": "Maintain clean housing, coat hygiene, and hoof care.",
        "activity": "Provide daily movement and shelter appropriate to local weather.",
        "health": "Monitor appetite, body condition, parasites, and signs of illness."
    },
    "malnadgidda": {
        "animal": "cattle",
        "grooming": "Keep the animal and resting area clean and check hooves regularly.",
        "activity": "Provide suitable grazing or movement opportunities and shelter.",
        "health": "Monitor body condition, hydration, parasites, and changes in behaviour."
    },
    "murrah": {
        "animal": "cattle",
        "grooming": "Maintain clean skin, housing, and hoof care; provide appropriate cooling.",
        "activity": "Provide space for movement and access to shade and water.",
        "health": "Monitor heat stress, skin condition, appetite, and udder health where applicable."
    },
    "redsindhi": {
        "animal": "cattle",
        "grooming": "Maintain coat cleanliness, clean housing, and routine hoof care.",
        "activity": "Provide daily movement, shade, and access to clean water.",
        "health": "Monitor appetite, body condition, hydration, and parasite risks."
    },
    "sahiwal": {
        "animal": "cattle",
        "grooming": "Keep the coat and housing clean and maintain hoof hygiene.",
        "activity": "Provide suitable movement, shade, and comfortable resting space.",
        "health": "Monitor body condition, hydration, and udder health where applicable."
    }
}


def get_recommendations(
    animal_type,
    breed,
    age_group,
    detected_disease="Healthy"
):
    """
    Return general care recommendations for a dog, cat, or cattle breed.

    Parameters:
        animal_type: dog, cat, or cattle
        breed: predicted or user-provided breed name
        age_group: young, adult, senior, old, puppy, kitten, or calf
        detected_disease: disease model output, default Healthy

    Returns:
        Dictionary containing care recommendations.
    """

    animal = str(animal_type).strip().lower()
    if animal in {"cow", "buffalo", "cattle", "bovine"}:
        animal = "cattle"

    if animal not in {"dog", "cat", "cattle"}:
        raise ValueError(
            "animal_type must be 'dog', 'cat', or 'cattle'."
        )

    breed_display = str(breed).strip()
    breed_key = normalize_name(breed_display)

    age_display = str(age_group).strip()
    age_key = age_display.lower()

    disease_display = str(detected_disease).strip() or "Unknown"
    disease_key = disease_display.lower()

    breed_info = BREED_CARE.get(breed_key)

    # Base diet advice varies by animal type.
    if animal == "dog":
        diet = [
            "Provide complete, balanced food formulated for dogs.",
            "Measure portions according to age, weight, activity, and body condition.",
            "Provide fresh drinking water every day."
        ]
    elif animal == "cat":
        diet = [
            "Provide complete, balanced food formulated for cats; do not use dog food as the main diet.",
            "Adjust portions according to age, weight, activity, and body condition.",
            "Provide fresh drinking water every day."
        ]
    else:
        diet = [
            "Provide suitable forage and roughage with a balanced ration.",
            "Adjust feed according to age, body condition, workload, and milk production where applicable.",
            "Provide continuous access to clean drinking water."
        ]

    # Age-specific guidance.
    if age_key in {"young", "puppy", "kitten", "calf"}:
        diet.append(
            "Young animals need age-appropriate nutrition and growth monitoring; ask a veterinarian about suitable feeding."
        )
        age_guidance = (
            "Arrange age-appropriate preventive care and monitor growth, "
            "appetite, activity, and weight."
        )
    elif age_key in {"senior", "old", "elderly"}:
        diet.append(
            "Review nutrition and portion sizes regularly as activity and health needs change with age."
        )
        age_guidance = (
            "Arrange regular health checks and monitor mobility, weight, "
            "appetite, and changes in behaviour."
        )
    else:
        age_guidance = (
            "Maintain a suitable body condition and review diet and activity as needs change."
        )

    # Breed-specific recommendations, with safe fallback guidance.
    if breed_info and breed_info["animal"] == animal:
        grooming = breed_info["grooming"]
        activity = breed_info["activity"]
        breed_health = breed_info["health"]
        breed_guidance_available = True
    else:
        grooming = (
            "Keep the coat or skin clean, check ears and nails or hooves, "
            "and maintain hygienic housing as appropriate."
        )
        activity = (
            "Provide safe, species-appropriate movement and enrichment "
            "suited to the animal's age and condition."
        )
        breed_health = (
            "Monitor appetite, activity, weight, and unusual symptoms."
        )
        breed_guidance_available = False

    vaccination = [
        "Review the animal's vaccination and preventive-care records.",
        "Ask a veterinarian for a schedule appropriate to species, age, location, and health."
    ]

    healthy_labels = {
        "healthy", "none", "normal", "no disease", "no_disease"
    }

    if disease_key in healthy_labels:
        health_guidance = [
            "Continue routine preventive care and health checks.",
            "Seek veterinary advice if unusual symptoms appear."
        ]
    else:
        health_guidance = [
            f"The model reported: {disease_display}. This is a prediction, not a confirmed diagnosis.",
            "Arrange veterinary assessment, especially if symptoms are new, worsening, or severe.",
            "Do not start medication or treatment based only on an image prediction."
        ]

    health_guidance.append(breed_health)
    health_guidance.append(age_guidance)

    return {
        "animal_type": animal,
        "breed": breed_display,
        "age_group": age_display,
        "detected_disease": disease_display,
        "breed_specific_guidance_available": breed_guidance_available,
        "diet": diet,
        "grooming": [grooming],
        "activity": [activity],
        "vaccination": vaccination,
        "health_guidance": health_guidance
    }
