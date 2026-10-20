import streamlit as st

from utils.care_recommendation import get_recommendations

st.set_page_config(
    page_title="AnimalCareAI",
    page_icon="🐾",
    layout="wide",
)

st.title("🐾 AnimalCareAI")
st.subheader("Personalized Animal Care Recommendations")

st.write(
    "Select an animal, breed, and age group to receive "
    "basic care guidance."
)

BREEDS = {
    "Dog": [
        "Beagle", "Boxer", "German Shepherd", "Golden Retriever",
        "Labrador Retriever", "Pomeranian", "Pug", "Rottweiler",
        "Shih Tzu", "Siberian Husky",
    ],
    "Cat": [
        "Bengal", "British Shorthair", "Domestic Shorthair",
        "Himalayan", "Maine Coon", "Persian", "Ragdoll",
        "Scottish Fold", "Siamese", "Sphynx",
    ],
    "Cattle": [
        "Amritmahal", "Gir", "Hallikar", "Holstein Friesian",
        "Jersey", "Kasargod", "Malnad_gidda", "Murrah",
        "Red Sindhi", "Sahiwal",
    ],
}

with st.sidebar:
    st.header("Animal Details")

    animal_type = st.selectbox(
        "Animal type",
        list(BREEDS.keys()),
    )

    breed = st.selectbox(
        "Breed",
        BREEDS[animal_type],
    )

    age_group = st.selectbox(
        "Age group",
        ["Young", "Adult", "Old"],
    )

    disease = st.selectbox(
        "Detected condition",
        ["Healthy", "Unknown"],
    )

if st.button("Get Care Recommendations", type="primary"):
    try:
        result = get_recommendations(
            animal_type=animal_type,
            breed=breed,
            age_group=age_group,
            detected_disease=disease,
        )

        st.success("Recommendations generated successfully!")

        st.write(
            "**Breed-specific guidance available:**",
            result["breed_specific_guidance_available"],
        )

        col1, col2 = st.columns(2)

        with col1:
            st.subheader("🥗 Diet")
            st.write(result["diet"])

            st.subheader("🧼 Grooming")
            st.write(result["grooming"])

            st.subheader("🏃 Activity")
            st.write(result["activity"])

        with col2:
            st.subheader("💉 Vaccination")
            st.write(result["vaccination"])

            st.subheader("🩺 Health Guidance")
            st.write(result["health_guidance"])

        st.caption(
            "These are general care suggestions, not a veterinary "
            "diagnosis. Consult a veterinarian for health concerns."
        )

    except Exception as error:
        st.error(f"Could not generate recommendations: {error}")

st.divider()
st.caption("AnimalCareAI | Animal health and personalized care")
