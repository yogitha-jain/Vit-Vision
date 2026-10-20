
from utils.care_recommendation import get_recommendations


DOG_BREEDS = [
    "Beagle",
    "Boxer",
    "German Shepherd",
    "Golden Retriever",
    "Labrador Retriever",
    "Pomeranian",
    "Pug",
    "Rottweiler",
    "Shih Tzu",
    "Siberian Husky",
]

CAT_BREEDS = [
    "Bengal",
    "British Shorthair",
    "Domestic Shorthair",
    "Himalayan",
    "Maine Coon",
    "Persian",
    "Ragdoll",
    "Scottish Fold",
    "Siamese",
    "Sphynx",
]

CATTLE_BREEDS = [
    "Amritmahal",
    "Gir",
    "Hallikar",
    "Holstein Friesian",
    "Jersey",
    "Kasargod",
    "Malnad_gidda",
    "Murrah",
    "Red Sindhi",
    "Sahiwal",
]


def print_section(title):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)


def print_recommendations(result):
    """Print every returned recommendation field."""
    for category, details in result.items():
        print(f"\n{category.upper().replace('_', ' ')}:")

        if isinstance(details, list):
            for item in details:
                print(f"- {item}")
        else:
            print(details)


def test_breed(animal_type, breed):
    """Run and validate recommendations for one breed."""
    result = get_recommendations(
        animal_type=animal_type,
        breed=breed,
        age_group="adult",
        detected_disease="Healthy"
    )

    required_fields = {
        "animal_type",
        "breed",
        "age_group",
        "detected_disease",
        "breed_specific_guidance_available",
        "diet",
        "grooming",
        "activity",
        "vaccination",
        "health_guidance",
    }

    missing_fields = required_fields - set(result.keys())
    assert not missing_fields, (
        f"{breed} is missing fields: {missing_fields}"
    )

    assert result["animal_type"] == animal_type
    assert result["breed"] == breed
    assert isinstance(result["diet"], list)
    assert len(result["diet"]) > 0
    assert isinstance(result["grooming"], list)
    assert isinstance(result["activity"], list)
    assert isinstance(result["vaccination"], list)
    assert isinstance(result["health_guidance"], list)

    if not result["breed_specific_guidance_available"]:
        raise AssertionError(
            f"No breed-specific guidance found for {breed}"
        )

    print_section(f"TESTING: {animal_type.upper()} - {breed}")
    print_recommendations(result)


def main():
    total = 0

    groups = [
        ("dog", DOG_BREEDS),
        ("cat", CAT_BREEDS),
        ("cattle", CATTLE_BREEDS),
    ]

    for animal_type, breeds in groups:
        for breed in breeds:
            test_breed(animal_type, breed)
            total += 1

    print_section("ALL TESTS PASSED")
    print(f"Successfully tested {total} breeds.")
    print("Dogs: 10")
    print("Cats: 10")
    print("Cattle: 10")


if __name__ == "__main__":
    main()
