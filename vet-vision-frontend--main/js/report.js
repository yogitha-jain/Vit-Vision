/* =========================================================
   VetVision report.js
   - Disease report: one page (condition info, signs, first aid, prevention)
   - Breed report:   one page (breed facts, care recommendations, health issues)
   ========================================================= */

const PAGE_W = 210;
const MARGIN = 18;
const CW = 174;          // content width
const MAX_Y = 287;       // content must end above this line

const GREEN = [94, 143, 109];
const DARK = [48, 72, 59];
const BODY = [60, 80, 69];
const GREY = [120, 135, 126];

/* ---------------------------------------------------------
   DISEASE INFORMATION  (keys: animal -> normalized class name)
   l = level, a = about, s = signs, f = first aid,
   p = prevention, h = can spread to humans, w = warning box
   --------------------------------------------------------- */

const LEVELS = {
    ok:     { label: "No disease detected",        fill: [226, 240, 230], color: [48, 110, 70] },
    soon:   { label: "See a vet soon",             fill: [253, 238, 214], color: [150, 95, 20] },
    urgent: { label: "Urgent: contact a vet now",  fill: [250, 222, 218], color: [170, 40, 30] }
};

function D(l, a, s, f, p, h, w) {
    return { l: l, a: a, s: s, f: f, p: p, h: !!h, w: w || "" };
}

const HEALTHY_DOG = D("ok",
    "No sign of a skin disease was found in this photo. Keep up regular care to keep your dog's skin and coat healthy.",
    ["New bald patches or flaky skin", "Constant itching, licking or scratching", "Redness, sores, lumps or a bad smell", "Changes in appetite, energy or weight"],
    ["Brush the coat regularly and check the skin every few weeks", "Feed a balanced diet and give fresh water every day", "Keep up vaccinations, deworming and flea and tick control as your vet advises", "Keep bedding clean and dry"],
    ["Book routine vet check-ups", "Bathe only when needed, with a dog-safe shampoo"]);

const HEALTHY_CAT = D("ok",
    "No sign of a skin disease was found in this photo. Keep up regular care to keep your cat's skin and coat healthy.",
    ["New bald patches or flaky skin", "Constant scratching, licking or over-grooming", "Scabs, redness or sores", "Changes in appetite, energy or weight"],
    ["Brush the coat regularly and check the skin every few weeks", "Feed a balanced cat diet and give fresh water every day", "Keep up vaccinations, deworming and flea control as your vet advises", "Keep bedding and litter areas clean"],
    ["Book routine vet check-ups", "Keep new pets apart until they have been checked"]);

const HEALTHY_CATTLE = D("ok",
    "No sign of a skin disease was found in this photo. Keep up regular care to keep the animal healthy.",
    ["Skin lumps, scabs or hair loss", "Fever, drooling or blisters on the mouth or feet", "Limping or reluctance to move", "A drop in appetite or milk yield"],
    ["Provide clean water, good quality feed and a clean, dry shelter", "Check the skin, udder and hooves regularly", "Follow the vaccination and deworming schedule from your vet", "Control ticks, lice and flies as your vet advises"],
    ["Keep new animals separate before adding them to the herd", "Avoid overcrowding and keep sheds well ventilated"]);

const DISEASE_INFO = {
    dog: {
        dermatitis: D("soon",
            "Dermatitis means inflamed, irritated skin. It has many causes, including allergies, flea bites, infection and contact with irritants.",
            ["Redness and itching", "Scratching, licking or chewing the skin", "Hair loss, scabs or sores", "Moist, greasy or smelly skin"],
            ["Stop the dog licking or scratching the area (a clean, soft collar can help)", "Rinse dirt off gently with clean lukewarm water and pat the skin dry", "Check for fleas and ticks, and remove any new shampoo, bedding or cleaner that may be the trigger", "Do not put human creams or home remedies on the skin without vet advice", "Take clear photos and note when it started, to show the vet"],
            ["Use regular flea and tick control as your vet advises", "Use a dog-safe shampoo and dry the coat well after baths"]),
        fungalinfections: D("soon",
            "Fungal skin infections are caused by fungi or yeast that grow well on warm, damp skin. They are more likely when the skin is damaged or the immune system is weak.",
            ["Patchy hair loss", "Flaky, crusty or greasy skin", "Redness and itching", "A musty smell, or darker, thickened skin"],
            ["Keep the dog away from other pets and children until a vet has checked it", "Wear gloves and wash your hands well after touching the skin", "Keep the affected skin clean and dry", "Wash bedding and grooming tools in hot water", "Do not use human antifungal creams without vet advice"],
            ["Dry the coat fully after baths and swimming", "Clean bedding and grooming tools regularly"], true),
        healthy: HEALTHY_DOG,
        hypersensitivity: D("soon",
            "Hypersensitivity is an overreaction of the immune system to something harmless, such as food, pollen, dust or flea saliva. It often shows up on the skin.",
            ["Itching and redness", "Hives or small bumps", "Licking the paws or scratching the ears", "Hair loss from constant scratching"],
            ["Note what the dog ate or touched in the last day or two and remove the likely trigger", "Stop the dog scratching or licking the area", "Rinse the skin with clean lukewarm water if pollen or a chemical may be on it", "Keep a record of food, products and walks to help the vet find the cause"],
            ["Avoid known triggers once your vet has found them", "Keep up flea control, because flea bites are a common trigger"],
            false, "Swelling of the face, trouble breathing or collapse is an emergency. Go to a vet immediately."),
        demodicosis: D("soon",
            "Demodicosis (demodectic mange) is caused by tiny Demodex mites that live in the hair follicles. It is most common in puppies and in dogs with a weak immune system, and it usually does not pass between healthy dogs.",
            ["Patchy hair loss, often around the eyes, mouth and legs", "Red, scaly or crusty skin", "Dark, thickened skin in long-standing cases", "Itching, sores or a bad smell if infected"],
            ["Keep the skin clean and dry and stop the dog scratching", "Do not use home remedies or medicated shampoos unless your vet advises it", "Feed a balanced diet and keep stress low to support the immune system", "Take photos of the affected areas for your vet (a skin test is needed to confirm)"],
            ["Provide good nutrition and regular vet check-ups", "Have any underlying illness treated"]),
        ringworm: D("soon",
            "Ringworm is a contagious fungal infection of the skin and hair. It is not a worm. It spreads by direct contact and through bedding, brushes and other surfaces.",
            ["Round patches of hair loss", "Scaly or crusty skin", "Redness and broken hairs", "Mild itching, or none at all"],
            ["Keep the dog away from other pets, children and people with weak immunity", "Wear gloves and wash your hands after touching the dog", "Wash bedding in hot water and vacuum floors and furniture often", "Disinfect brushes, bowls and carriers", "Do not use human creams without vet advice"],
            ["Clean bedding and grooming tools regularly", "Avoid contact with animals that have skin patches"], true)
    },

    cat: {
        fleaallergy: D("soon",
            "Flea allergy dermatitis is an allergic reaction to flea saliva. Even a few flea bites can cause intense itching in an allergic cat.",
            ["Intense itching and over-grooming", "Small scabs around the neck and base of the tail", "Hair loss on the back or belly", "Black specks (flea dirt) in the coat"],
            ["Comb the coat with a fine flea comb over white paper to look for fleas and flea dirt", "Wash bedding in hot water and vacuum floors and furniture often", "Keep the nails short to limit skin damage from scratching", "Never use dog flea products on cats, because some are toxic to them", "Ask your vet for a cat-safe flea control plan"],
            ["Use year-round flea control for all pets in the home, as your vet advises", "Clean bedding and carpets regularly"]),
        health: HEALTHY_CAT,
        healthy: HEALTHY_CAT,
        ringworm: D("soon",
            "Ringworm is a contagious fungal infection of the skin and hair. It is not a worm. Cats can carry it without obvious signs, and it spreads through contact and contaminated surfaces.",
            ["Round patches of hair loss, often on the head, ears or legs", "Scaly or crusty skin", "Broken hairs and a dull coat", "Mild itching, or none at all"],
            ["Keep the cat in one room away from other pets, children and people with weak immunity", "Wear gloves and wash your hands after handling the cat", "Wash bedding in hot water and vacuum floors and furniture often", "Disinfect brushes, bowls and carriers", "Do not use human creams without vet advice"],
            ["Clean bedding and grooming tools regularly", "Keep new or stray cats apart until they have been checked"], true),
        scabies: D("soon",
            "Scabies is caused by tiny mites that burrow into the skin. It is very itchy and spreads easily between animals, and it can briefly irritate human skin.",
            ["Severe itching and scratching", "Crusty, scabby skin on the ear edges and face", "Hair loss and redness", "Sores from scratching"],
            ["Keep the cat away from other pets until a vet has checked it", "Wear gloves and wash your hands after handling the cat", "Wash bedding in hot water and clean the places where the cat rests", "Keep the nails short to limit skin damage", "Do not use dog products or home remedies; a vet needs to confirm the mites"],
            ["Avoid contact with stray or sick animals", "Check new pets and clean bedding regularly"], true)
    },

    cattle: {
        dermatophilosis: D("soon",
            "Dermatophilosis (also called rain scald) is a bacterial skin infection. It is more common in wet weather and when the skin is damaged by ticks, flies or constant moisture.",
            ["Crusts and scabs with matted tufts of hair", "Lesions on the back, neck and sides", "Painful, raw skin under the scabs", "Poor body condition in severe cases"],
            ["Move the animal to a dry, sheltered place", "Do not pull off the scabs, because it hurts and spreads the infection", "Separate it from the herd and use gloves and clean tools", "Control ticks and biting flies in the shed", "Call your vet for confirmation and treatment"],
            ["Provide dry shelter, good drainage and clean bedding", "Control ticks and flies and avoid overcrowding"], true),
        footandmouth: D("urgent",
            "Foot-and-mouth disease is a highly contagious viral disease of cattle and other cloven-hoofed animals. It spreads very fast through animals, people, vehicles and feed.",
            ["Fever and loss of appetite", "Drooling and blisters in the mouth or on the tongue", "Blisters or sores on the feet, with lameness", "Blisters on the teats and a sudden drop in milk"],
            ["Isolate the animal at once and do not move animals, people or vehicles in or out of the area", "Contact your nearest veterinary officer or animal husbandry department immediately", "Wash hands, boots and equipment with disinfectant after any contact", "Give soft feed and clean water in a clean, dry, shaded place", "Do not treat at home, and do not sell or move the animal"],
            ["Vaccinate on the schedule set by your vet or the government programme", "Keep new animals separate for several weeks and limit visitors"],
            false, "This is a serious, notifiable disease. Contact a vet or the animal health authority straight away."),
        healthy: HEALTHY_CATTLE,
        lumpy: D("urgent",
            "Lumpy skin disease is a viral disease of cattle and buffalo spread mainly by biting insects such as flies, mosquitoes and ticks. It can cause serious illness and big losses in milk.",
            ["Firm, round lumps on the skin, several centimetres across", "Fever and swollen lymph glands", "Swelling of the legs or brisket", "Less feed and milk, and sometimes watery eyes or nose"],
            ["Isolate the sick animal in a clean, shaded, insect-free shed and do not move it", "Contact your veterinary officer, because the disease must be confirmed and reported", "Control flies, mosquitoes and ticks, and remove standing water", "Give soft feed and plenty of clean water", "Keep any sores clean, and wash hands and equipment after handling"],
            ["Vaccinate the herd as advised by your vet or the government programme", "Control insects and keep new animals separate before adding them to the herd"],
            false, "Report suspected cases to your veterinary officer without delay."),
        mastitis: D("soon",
            "Mastitis is an infection and inflammation of the udder, most often caused by bacteria entering through the teat. It is common in dairy animals and lowers milk quality and yield.",
            ["Hot, swollen, hard or painful udder", "Clots, flakes, watery or bloody milk", "Less milk from one or more quarters", "Fever, dullness or kicking when the udder is touched"],
            ["Keep the animal in a clean, dry place and milk it last, with clean hands and equipment", "Gently milk out the affected quarter and discard the abnormal milk safely; do not give it to people or calves", "Do not use home remedies or leftover medicines on the udder", "Call your vet soon, because treatment depends on the type of infection"],
            ["Wash and dry the teats before milking and follow your vet's teat-dip advice", "Keep bedding clean and dry and milk with clean hands and equipment"]),
        pediculosis: D("soon",
            "Pediculosis means infestation with lice. It is more common in winter, in crowded sheds and in animals with poor nutrition.",
            ["Constant itching and rubbing on posts or walls", "Rough, dull coat and hair loss", "Small lice or white eggs at the base of the hairs", "Scabs, restlessness and weight loss"],
            ["Separate heavily affected animals from the herd", "Part the hair on the neck, shoulders and tail to look for lice and eggs", "Clean the shed, replace bedding and keep it dry", "Do not use farm chemicals or sprays on the animal without vet advice, because many are toxic", "Ask your vet for a safe plan that includes all animals in contact"],
            ["Feed a balanced diet and avoid overcrowding", "Check the coat regularly, especially in winter"]),
        ringworm: D("soon",
            "Ringworm in cattle is a fungal skin infection. It is most common in calves, in winter and in crowded, damp sheds, and it can spread to people.",
            ["Grey-white, crusty, round patches", "Often on the head, around the eyes and on the neck", "Hair loss with dry, flaky skin", "Mild itching"],
            ["Separate the affected animal from the herd, especially from calves", "Wear gloves and wash your hands well after handling", "Disinfect halters, brushes and other shared equipment", "Improve sunlight, ventilation and dryness in the shed", "Do not use human creams without vet advice"],
            ["Do not share grooming tools between animals", "Keep sheds dry, clean and well ventilated, and keep new animals separate"], true)
    }
};

const GENERIC_DISEASE = D("soon",
    "No detailed guide is available for this condition yet. Please have a veterinarian examine the animal.",
    [],
    ["Keep the animal calm, clean and comfortable", "Keep it away from other animals until a vet has checked it", "Take clear photos and note when the signs started"],
    []);

/* ---------------------------------------------------------
   BREED INFORMATION  (keys: normalized breed name)
   --------------------------------------------------------- */

function P(origin, size, weight, life, coat, temper) {
    return [["Origin", origin], ["Size", size], ["Weight", weight],
            ["Lifespan", life], ["Coat", coat], ["Temperament", temper]];
}

function C(origin, use, size, milk, climate, temper) {
    return [["Origin", origin], ["Main use", use], ["Size", size],
            ["Milk yield", milk], ["Climate", climate], ["Temperament", temper]];
}

const BREED_INFO = {
    /* DOGS */
    beagle: {
        about: "The Beagle is a small scent hound bred for hunting by smell. It is friendly, curious and good with families, but it follows its nose and can be stubborn.",
        facts: P("England", "Small to medium", "9-14 kg", "12-15 years", "Short, dense, weather-resistant", "Friendly, curious, food-driven"),
        issues: ["Weight gain: watch food portions and body shape", "Ear infections: scratching, head shaking or a bad smell", "Cherry eye: red swelling in the corner of the eye"]
    },
    boxer: {
        about: "The Boxer is a strong, playful working breed that stays puppy-like for years. It is loyal and good with children but needs plenty of activity.",
        facts: P("Germany", "Medium to large", "25-32 kg", "10-12 years", "Short and smooth", "Playful, energetic, loyal"),
        issues: ["Heart problems: tiring easily, fainting or coughing", "Heat and breathing trouble: heavy panting in warm weather", "Skin lumps: have any new lump checked by a vet"]
    },
    germanshepherd: {
        about: "The German Shepherd is an intelligent, loyal working dog used in police, herding and service roles. It needs training, exercise and a job to do.",
        facts: P("Germany", "Large", "22-40 kg", "9-13 years", "Medium-length double coat", "Intelligent, loyal, protective"),
        issues: ["Hip and elbow problems: limping or trouble getting up", "Bloat: swollen belly and retching (an emergency)", "Skin and stomach sensitivity: itching or loose stools"]
    },
    goldenretriever: {
        about: "The Golden Retriever is a gentle, friendly family dog first bred to retrieve game. It is eager to please and easy to train.",
        facts: P("Scotland", "Large", "25-34 kg", "10-12 years", "Dense, water-repellent double coat", "Friendly, gentle, eager to please"),
        issues: ["Hip and elbow problems: stiffness or limping", "Skin allergies and ear infections: itching and head shaking", "Lumps: have any new lump checked early"]
    },
    labradorretriever: {
        about: "The Labrador Retriever is a friendly, active dog and one of the most popular family breeds. It loves food and water and needs regular exercise.",
        facts: P("Canada (Newfoundland)", "Large", "25-36 kg", "10-12 years", "Short, dense, water-resistant", "Outgoing, friendly, trainable"),
        issues: ["Obesity: watch portions and body shape", "Hip and elbow problems: limping or stiffness", "Ear infections: scratching or a bad smell"]
    },
    pomeranian: {
        about: "The Pomeranian is a tiny, lively dog with a fluffy double coat and a bold personality. It is alert and often barks at new sounds.",
        facts: P("Pomerania (Germany and Poland)", "Toy", "1.5-3.5 kg", "12-16 years", "Long, fluffy double coat", "Lively, bold, alert"),
        issues: ["Dental disease: bad breath or tooth loss", "Slipping kneecap: skipping or hopping on a back leg", "Collapsing windpipe: honking cough, especially when excited"]
    },
    pug: {
        about: "The Pug is a small, affectionate companion dog with a flat face and wrinkled skin. It loves company but struggles with heat and heavy exercise.",
        facts: P("China", "Small", "6-9 kg", "12-15 years", "Short and smooth", "Affectionate, playful, charming"),
        issues: ["Breathing trouble: noisy breathing or tiring quickly", "Eye injuries: squinting or eye discharge", "Skin fold infections: redness or a smell in the folds"]
    },
    rottweiler: {
        about: "The Rottweiler is a strong, confident guardian breed that is loyal to its family. It needs firm, kind training and early socialisation.",
        facts: P("Germany", "Large", "36-60 kg", "8-10 years", "Short, dense double coat", "Confident, loyal, calm"),
        issues: ["Hip and elbow problems: limping or stiffness", "Cruciate ligament injury: sudden limping on a back leg", "Obesity: keep a lean body shape"]
    },
    shihtzu: {
        about: "The Shih Tzu is a small, friendly companion dog with a long, silky coat. It enjoys company and short walks, and its coat needs regular care.",
        facts: P("China and Tibet", "Small", "4-7 kg", "10-16 years", "Long, silky double coat", "Affectionate, outgoing, playful"),
        issues: ["Eye problems: squinting, tearing or discharge", "Dental disease: bad breath or loose teeth", "Breathing and heat sensitivity: noisy breathing in warm weather"]
    },
    siberianhusky: {
        about: "The Siberian Husky is an energetic, friendly sled dog bred for cold climates. It loves to run and is known for escaping and howling.",
        facts: P("Siberia (Russia)", "Medium", "16-27 kg", "12-14 years", "Thick double coat", "Friendly, energetic, independent"),
        issues: ["Eye problems: cloudy eyes or poor vision", "Hip problems: limping or reluctance to run", "Heat stress: heavy panting and weakness in hot weather"]
    },

    /* CATS */
    bengal: {
        about: "The Bengal is an active, athletic cat with a wild-looking spotted or marbled coat. It is clever and playful and needs lots of play and climbing space.",
        facts: P("USA", "Medium", "3.5-7 kg", "12-16 years", "Short, dense, spotted or marbled", "Active, curious, playful"),
        issues: ["Heart disease: tiring easily or fast breathing", "Inherited eye disease: bumping into things or poor night vision", "Dental disease: bad breath or drooling"]
    },
    britishshorthair: {
        about: "The British Shorthair is a calm, sturdy cat with a dense, plush coat and a round face. It is easygoing and affectionate, though not always a lap cat.",
        facts: P("United Kingdom", "Medium to large", "4-8 kg", "12-17 years", "Short, dense, plush", "Calm, easygoing, affectionate"),
        issues: ["Heart disease: fast breathing or tiring easily", "Obesity: watch portions and body shape", "Gum and dental disease: bad breath or drooling"]
    },
    domesticshorthair: {
        about: "The Domestic Short Hair is not one standard breed. It is a cat of mixed ancestry with a short coat, so size, colour and personality vary a lot.",
        facts: P("Worldwide (mixed ancestry)", "Medium", "3.5-5.5 kg", "12-18 years", "Short, many colours and patterns", "Varies, usually adaptable"),
        issues: ["Weight gain: watch portions and play time", "Dental disease: bad breath or drooling", "Urinary problems: straining or frequent trips to the litter box"]
    },
    himalayan: {
        about: "The Himalayan is a gentle, quiet cat with a long, thick coat and Siamese-style colour points. It combines Persian and Siamese lines and prefers calm homes.",
        facts: P("USA and UK", "Medium", "3.5-5.5 kg", "9-15 years", "Long, thick, needs daily combing", "Gentle, quiet, calm"),
        issues: ["Breathing trouble: noisy or open-mouth breathing", "Watery eyes: tear stains or squinting", "Kidney disease: drinking and urinating more"]
    },
    mainecoon: {
        about: "The Maine Coon is one of the largest domestic cats, with a shaggy, water-resistant coat. It is gentle, sociable and good with families.",
        facts: P("USA (Maine)", "Large", "5-9 kg", "10-13 years", "Long, shaggy, water-resistant", "Gentle, friendly, sociable"),
        issues: ["Heart disease: fast breathing or tiring easily", "Hip problems: stiffness or trouble jumping", "Dental disease: bad breath or drooling"]
    },
    persian: {
        about: "The Persian is a calm, sweet-natured cat with a very long, thick coat and a flat face. It prefers a quiet home and needs daily grooming.",
        facts: P("Persia (Iran), developed in the UK", "Medium", "3.5-5.5 kg", "12-17 years", "Very long, thick, needs daily combing", "Calm, sweet, quiet"),
        issues: ["Breathing trouble: noisy or open-mouth breathing", "Watery eyes: tear stains or eye discharge", "Kidney disease: drinking and urinating more"]
    },
    ragdoll: {
        about: "The Ragdoll is a large, relaxed cat that often goes limp when held. It is affectionate and likes to follow its owners around the house.",
        facts: P("USA (California)", "Large", "4.5-9 kg", "12-17 years", "Semi-long, silky", "Docile, affectionate, relaxed"),
        issues: ["Heart disease: fast breathing or tiring easily", "Weight gain: watch portions and play time", "Urinary problems: straining or blood in the urine"]
    },
    scottishfold: {
        about: "The Scottish Fold is known for its folded ears and round face. It is sweet, quiet and adaptable, but the gene behind the folded ears can affect the joints.",
        facts: P("Scotland", "Medium", "3-6 kg", "11-15 years", "Short or long, dense", "Sweet, quiet, adaptable"),
        issues: ["Joint and bone disease: stiffness or reluctance to jump", "Ear problems: scratching or dark wax", "Heart disease: fast breathing or tiring easily"]
    },
    siamese: {
        about: "The Siamese is a slim, elegant, very vocal cat that loves company. It is clever and active and does not like being left alone for long.",
        facts: P("Thailand (Siam)", "Medium, slender", "3-5.5 kg", "12-18 years", "Short, fine, with colour points", "Vocal, social, intelligent"),
        issues: ["Dental disease: bad breath or drooling", "Breathing problems: coughing or wheezing", "Eye problems: squinting or discharge"]
    },
    sphynx: {
        about: "The Sphynx is a nearly hairless cat with wrinkled, warm skin. It is outgoing and affectionate and loves warmth and company.",
        facts: P("Canada", "Medium", "3.5-5.5 kg", "9-15 years", "Hairless or fine down", "Outgoing, affectionate, energetic"),
        issues: ["Skin problems: oily skin, rashes or sunburn", "Heart disease: fast breathing or tiring easily", "Cold sensitivity: shivering or seeking heat"]
    },

    /* CATTLE AND BUFFALO */
    amritmahal: {
        about: "Amritmahal is an Indian draught breed known for strength and endurance. It was historically valued for hauling loads over long distances.",
        facts: C("Karnataka, India", "Draught (farm and transport work)", "Medium, grey coat, long horns", "Low", "Hot, dry regions", "Alert and spirited"),
        issues: ["Hoof and leg strain: limping or uneven walking", "Ticks and worms: weight loss or a dull coat", "Heat stress: heavy breathing and weakness"]
    },
    gir: {
        about: "Gir is a well-known Indian dairy breed with a domed forehead and long, drooping ears. It is valued for its milk, heat tolerance and calm nature.",
        facts: C("Gujarat, India", "Dairy", "Medium to large", "Good for an Indian breed", "Hot climates, tolerates heat and ticks well", "Calm and docile"),
        issues: ["Mastitis: hot, swollen udder or clots in the milk", "Tick-borne disease: fever, weakness or pale gums", "Foot problems: limping or swollen hooves"]
    },
    hallikar: {
        about: "Hallikar is an Indian draught breed with long, backward-sweeping horns. It is known for speed and stamina in farm work.",
        facts: C("Karnataka, India", "Draught", "Medium, grey coat", "Low", "Hot, dry regions", "Active and spirited"),
        issues: ["Hoof and leg strain: limping or uneven walking", "Ticks and worms: weight loss or a dull coat", "Foot-and-mouth disease: drooling, blisters and fever"]
    },
    holsteinfriesian: {
        about: "Holstein Friesian is the world's best-known high-yield dairy breed, easily recognised by its black and white patches. It gives a lot of milk but needs good feed and a cool environment.",
        facts: C("Netherlands and Germany", "Dairy", "Large, about 600-700 kg", "Very high", "Cool climates, sensitive to heat", "Docile and calm"),
        issues: ["Mastitis: hot, swollen udder or clots in the milk", "Heat stress: drooling, heavy breathing and less milk", "Lameness: limping or standing with an arched back"]
    },
    jersey: {
        about: "Jersey is a small dairy breed known for milk with a high butterfat content. It is gentle and alert and adapts to warmer climates better than Holstein.",
        facts: C("Jersey island, Channel Islands", "Dairy", "Small to medium, about 400-450 kg", "High, rich in butterfat", "Moderate to warm climates", "Alert and gentle"),
        issues: ["Milk fever: weakness or trembling after calving", "Mastitis: hot, swollen udder or clots in the milk", "Heat stress: heavy breathing and less milk"]
    },
    kasargod: {
        about: "Kasargod is a small, hardy dwarf cattle breed from northern Kerala. It is valued for its disease resistance and low feed needs.",
        facts: C("Kerala, India", "Small-scale milk and manure", "Very small (dwarf)", "Low", "Hot, humid coastal climate", "Docile and easy to handle"),
        issues: ["Ticks and worms: weight loss or a dull coat", "Mastitis: hot, swollen udder or clots in the milk", "Skin infections: scabs or hair loss in wet weather"]
    },
    malnadgidda: {
        about: "Malnad Gidda is a small, hardy dwarf cattle breed from the hilly Western Ghats region of Karnataka. It is known for tolerating heavy rain and disease.",
        facts: C("Karnataka, India (Malnad hills)", "Small-scale milk and manure", "Very small (dwarf)", "Low, but rich milk", "High-rainfall, hilly areas", "Docile and hardy"),
        issues: ["Foot rot and lameness: limping on wet ground", "Ticks and worms: weight loss or a dull coat", "Skin infections: scabs or hair loss in the rainy season"]
    },
    murrah: {
        about: "Murrah is a buffalo breed, not a cow, and is the top dairy buffalo of India. It has tightly curled horns and a black coat, and gives very rich milk.",
        facts: C("Haryana and Punjab, India", "Dairy (buffalo)", "Large and heavy, black coat", "Very high among buffalo breeds", "Hot climates; needs shade and water to cool off", "Calm and docile"),
        issues: ["Heat stress: heavy breathing and less milk", "Mastitis: hot, swollen udder or clots in the milk", "Breeding and calving problems: irregular heat or retained afterbirth"]
    },
    redsindhi: {
        about: "Red Sindhi is a hardy, red-coated dairy breed that does well in hot climates. It is known for good milk yield and tick tolerance.",
        facts: C("Sindh (Pakistan), now common in India", "Dairy", "Small to medium, red coat", "Good", "Hot climates, tolerates heat and ticks", "Docile and gentle"),
        issues: ["Mastitis: hot, swollen udder or clots in the milk", "Tick-borne disease: fever, weakness or pale gums", "Heat stress: heavy breathing and less milk"]
    },
    sahiwal: {
        about: "Sahiwal is one of the best dairy breeds among Indian zebu cattle, with a reddish-brown coat and loose skin. It tolerates heat and ticks well and is calm to handle.",
        facts: C("Punjab region (India and Pakistan)", "Dairy", "Medium to large, reddish-brown coat", "High for a zebu breed", "Hot climates, tolerates heat and ticks", "Calm and docile"),
        issues: ["Mastitis: hot, swollen udder or clots in the milk", "Tick-borne disease: fever, weakness or pale gums", "Lameness: limping or swollen hooves"]
    }
};

/* Used only if the backend recommendation call fails. */
const AGE_RULES = { dog: [1, 8], cat: [1, 10], cattle: [2, 12] };

function fallbackCare(animal) {

    const a = animalKeyOf(animal);

    const diet = a === "cattle"
        ? ["Provide suitable forage and roughage with a balanced ration.", "Adjust feed to age, body condition, workload and milk production.", "Provide continuous access to clean drinking water."]
        : ["Provide complete, balanced food made for " + (a === "cat" ? "cats" : "dogs") + ".", "Adjust portions to age, weight, activity and body condition.", "Provide fresh drinking water every day."];

    return {
        breed_specific_guidance_available: false,
        diet: diet,
        activity: ["Provide safe, species-appropriate movement and enrichment suited to the animal's age and condition."],
        grooming: ["Keep the coat or skin clean, check ears and nails or hooves, and keep housing hygienic."],
        vaccination: ["Review the animal's vaccination and preventive-care records.", "Ask a veterinarian for a schedule suited to species, age, location and health."]
    };
}

/* =========================================================
   PAGE LOGIC
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const pdfButton = document.getElementById("downloadReportBtn");
    const vetsButton = document.getElementById("findVetsBtn");

    const data = readResult();

    if (vetsButton) {
        vetsButton.addEventListener("click", () => {

            const animal = String((data && data.animalType) || "").toLowerCase();

            const query =
                animal === "cattle"
                    ? "livestock veterinary hospital near me"
                    : "veterinary clinic near me";

            window.open(
                "https://www.google.com/maps/search/?api=1&query=" +
                encodeURIComponent(query),
                "_blank",
                "noopener"
            );
        });
    }

    if (pdfButton) {
        pdfButton.addEventListener("click", async () => {

            if (!data) {
                alert("No result to export yet. Run an analysis first.");
                return;
            }

            if (!window.jspdf || !window.jspdf.jsPDF) {
                alert("The PDF library could not be loaded. Check your internet connection and try again.");
                return;
            }

            const originalText = pdfButton.textContent;
            pdfButton.disabled = true;
            pdfButton.textContent = "Preparing...";

            try {
                await buildReport(data);
            } catch (error) {
                console.error("VetVision report error:", error);
                alert("Could not create the report. Please try again.");
            }

            pdfButton.disabled = false;
            pdfButton.textContent = originalText;
        });
    }

    function readResult() {

        const stored = sessionStorage.getItem("vetvisionDetectionResult");

        if (!stored) return null;

        try {
            return JSON.parse(stored);
        } catch (error) {
            return null;
        }
    }
});

/* =========================================================
   BUILD REPORT
   ========================================================= */

async function buildReport(result) {

    const isBreed =
        result.detectionType === "breed" || (!result.disease && !!result.breed);

    let imgSize = null;

    if (result.imageUrl) {
        try {
            imgSize = await getImageSize(result.imageUrl);
        } catch (error) {
            imgSize = null;
        }
    }

    let care = null;
    let ageInfo = null;

    if (isBreed) {
        ageInfo = readAge(result);
        care = (await fetchCare(result, ageInfo)) || fallbackCare(result.animalType);
    }

    /* Try full size first, then shrink slightly until it fits on one page. */
    const scales = [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7];
    let out = null;

    for (const s of scales) {

        out = isBreed
            ? renderBreed(result, imgSize, care, ageInfo, s)
            : renderDisease(result, imgSize, s);

        if (out.endY <= MAX_Y) break;
    }

    const now = new Date();

    const stamp =
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0");

    const animalSlug = String(result.animalType || "animal")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");

    out.doc.save(
        "vetvision-" + (isBreed ? "breed" : "disease") + "-" +
        animalSlug + "-" + stamp + ".pdf"
    );
}

/* =========================================================
   DISEASE REPORT
   ========================================================= */

function renderDisease(result, imgSize, s) {

    const doc = makeDoc("Disease Detection");
    const low = !!result.lowConfidence;

    const animalKey = animalKeyOf(result.animalType);
    const group = DISEASE_INFO[animalKey] || {};
    const info = group[normKey(result.disease || result.diseaseDisplay)] || GENERIC_DISEASE;
    const level = LEVELS[info.l];
    const healthy = info.l === "ok";

    const rows = [
        ["Animal", capitalize(result.animalType || "Not available")],
        [low ? "Possible condition" : "Detected condition", result.diseaseDisplay || prettyLabel(result.disease) || "Not available"],
        ["Confidence", String(result.confidence || "Not available")],
        ["Report generated", dateString()]
    ];

    let y = drawTop(doc, result, imgSize, rows, 38, s);

    /* Urgency label */
    y += 3 * s;
    const pillW = pill(doc, level.label, MARGIN, y, level.fill, level.color, s);

    if (info.h) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9 * s);
        doc.setTextColor(150, 60, 40);
        doc.text("Can spread to humans: wash hands after handling", MARGIN + pillW + 4, y + 4.9 * s);
    }

    y += 7 * s + 3 * s;

    if (low) {
        y = noteBox(doc,
            "The model was not very sure about this result, so the information below is for a possible condition. Please have a vet confirm it.",
            y, s, "amber");
    }

    /* About */
    y += 4 * s;
    y = sectionTitle(doc,
        healthy ? "About this result" : (low ? "About this possible condition" : "About this condition"),
        MARGIN, y, CW, s);
    y = paragraph(doc, info.a, MARGIN, y, CW, s);

    /* Signs */
    if (info.s.length) {
        y += 4 * s;
        y = sectionTitle(doc, healthy ? "Signs to watch for" : "Common signs", MARGIN, y, CW, s);
        y = bulletList(doc, info.s, MARGIN, y, CW, s);
    }

    /* First aid */
    if (info.f.length) {
        y += 4 * s;
        y = sectionTitle(doc, healthy ? "Routine care tips" : "First aid and what to do now", MARGIN, y, CW, s);
        y = bulletList(doc, info.f, MARGIN, y, CW, s);
    }

    /* Warning */
    if (info.w) {
        y += 1 * s;
        y = noteBox(doc, info.w, y, s, "red");
    }

    /* Prevention */
    if (info.p.length) {
        y += 4 * s;
        y = sectionTitle(doc, "Prevention", MARGIN, y, CW, s);
        y = bulletList(doc, info.p, MARGIN, y, CW, s);
    }

    return { doc: doc, endY: y };
}

/* =========================================================
   BREED REPORT
   ========================================================= */

function renderBreed(result, imgSize, care, ageInfo, s) {

    const doc = makeDoc("Breed Detection");
    const low = !!result.lowConfidence;

    const animalKey = animalKeyOf(result.animalType);
    const info = BREED_INFO[normKey(result.breed || result.breedRaw)] || null;

    let ageText = "Not provided";

    if (ageInfo) {
        const group = care && care.age_group
            ? capitalize(care.age_group)
            : capitalize(ageGroupLocal(animalKey, ageInfo.age, ageInfo.unit));
        ageText = formatAge(ageInfo) + " (" + group + ")";
    }

    const rows = [
        ["Animal", capitalize(result.animalType || "Not available")],
        [low ? "Possible breed" : "Detected breed", result.breed || "Not available"],
        ["Confidence", String(result.confidence || "Not available")]
    ];

    const alt = closeSecond(result.top3);

    if (alt) rows.push(["Could also be", alt]);

    rows.push(["Age", ageText]);
    rows.push(["Report generated", dateString()]);

    let y = drawTop(doc, result, imgSize, rows, 38, s);

    /* Notes */
    if (result.animalMismatch && result.modelThinksAnimal) {
        y += 3 * s;
        y = noteBox(doc,
            "Warning: the model thinks this photo shows a " + result.modelThinksAnimal +
            ", not a " + result.animalType + ". Check that the right animal was selected.",
            y, s, "amber");
    }

    if (low) {
        y += 3 * s;
        y = noteBox(doc,
            "The model was not very sure about this breed, so the breed details are for a possible match and the care advice is general. A clearer photo showing the whole animal may give a better result.",
            y, s, "amber");
    }

    /* About the breed */
    y += 4 * s;
    y = sectionTitle(doc, low ? "About this possible breed" : "About the breed", MARGIN, y, CW, s);

    if (info) {
        y = paragraph(doc, info.about, MARGIN, y, CW, s);
        y += 1 * s;
        y = factsGrid(doc, info.facts, y, s);
    } else {
        y = paragraph(doc,
            "Detailed facts are not available for this breed yet. See the care recommendations below.",
            MARGIN, y, CW, s);
    }

    /* Care recommendations */
    y += 3 * s;
    y = sectionTitle(doc, "Care recommendations", MARGIN, y, CW, s);

    if (care && care.breed_specific_guidance_available === false) {
        y = paragraph(doc, "General care advice for this type of animal.", MARGIN, y - 1 * s, CW, s, 8.5, GREY, "italic");
    }

    const colGap = 6;
    const colW = (CW - colGap) / 2;
    const rightX = MARGIN + colW + colGap;

    let yl = subHeading(doc, "Feeding and diet", MARGIN, y, s);
    yl = bulletList(doc, care.diet || [], MARGIN, yl, colW, s, 9);
    yl += 1 * s;
    yl = subHeading(doc, "Vaccination and health checks", MARGIN, yl, s);
    yl = bulletList(doc, care.vaccination || [], MARGIN, yl, colW, s, 9);

    let yr = subHeading(doc, "Exercise and activity", rightX, y, s);
    yr = bulletList(doc, care.activity || [], rightX, yr, colW, s, 9);
    yr += 1 * s;
    yr = subHeading(doc, "Grooming and hygiene", rightX, yr, s);
    yr = bulletList(doc, care.grooming || [], rightX, yr, colW, s, 9);

    y = Math.max(yl, yr);

    /* Health issues */
    if (info && info.issues && info.issues.length) {
        y += 3 * s;
        y = sectionTitle(doc,
            low ? "Possible health issues to watch" : "Common health issues in this breed",
            MARGIN, y, CW, s);
        y = bulletList(doc, info.issues, MARGIN, y, CW, s);
    }

    return { doc: doc, endY: y };
}

/* =========================================================
   DRAWING HELPERS
   ========================================================= */

function lh(fontSize) {
    return fontSize * 0.3528 * 1.35;
}

function makeDoc(typeLabel) {

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setLineHeightFactor(1.35);

    doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
    doc.rect(0, 0, PAGE_W, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(21);
    doc.text("VetVision", MARGIN, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.text("AI Analysis Report - " + typeLabel, MARGIN, 21);

    return doc;
}

/* Photo on the left, summary table on the right. Returns the bottom edge. */
function drawTop(doc, result, imgSize, rows, y, s) {

    const maxW = 56 * s;
    const maxH = 54 * s;
    const hasImage = !!(result.imageUrl && imgSize);

    let imgH = 0;

    if (hasImage) {

        const scale = Math.min(maxW / imgSize.width, maxH / imgSize.height);
        const w = imgSize.width * scale;
        const h = imgSize.height * scale;

        try {
            doc.setDrawColor(224, 232, 226);
            doc.roundedRect(MARGIN - 1, y - 1, w + 2, h + 2, 2, 2, "S");
            doc.addImage(result.imageUrl, "JPEG", MARGIN, y, w, h);
            imgH = h + 2;
        } catch (error) {
            imgH = 0;
        }
    }

    const startX = hasImage ? MARGIN + maxW + 8 : MARGIN;
    const labelW = 36;
    const valueW = CW - (startX - MARGIN) - labelW;

    const rowsEnd = summaryRows(doc, rows, startX, y, labelW, valueW, s);

    return Math.max(y + imgH, rowsEnd) + 2;
}

function summaryRows(doc, rows, x, y, labelW, valueW, s) {

    rows.forEach(row => {

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5 * s);

        const lines = doc.splitTextToSize(String(row[1]), valueW);
        const h = Math.max(8 * s, lines.length * lh(10.5 * s) + 3.5 * s);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5 * s);
        doc.setTextColor(GREY[0], GREY[1], GREY[2]);
        doc.text(row[0], x, y + 5 * s);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5 * s);
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.text(lines, x + labelW, y + 5 * s);

        doc.setDrawColor(229, 235, 230);
        doc.line(x, y + h - 1 * s, x + labelW + valueW, y + h - 1 * s);

        y += h;
    });

    return y;
}

function sectionTitle(doc, text, x, y, w, s) {

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5 * s);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(text, x, y);

    doc.setDrawColor(GREEN[0], GREEN[1], GREEN[2]);
    doc.setLineWidth(0.4);
    doc.line(x, y + 1.6 * s, x + w, y + 1.6 * s);
    doc.setLineWidth(0.2);

    return y + 6.2 * s;
}

function subHeading(doc, text, x, y, s) {

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5 * s);
    doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
    doc.text(text, x, y);

    return y + 4.8 * s;
}

function paragraph(doc, text, x, y, w, s, fs, color, style) {

    const size = (fs || 9.5) * s;
    const c = color || BODY;

    doc.setFont("helvetica", style || "normal");
    doc.setFontSize(size);
    doc.setTextColor(c[0], c[1], c[2]);

    const lines = doc.splitTextToSize(String(text), w);
    doc.text(lines, x, y);

    return y + lines.length * lh(size) + 1.2 * s;
}

function bulletList(doc, items, x, y, w, s, fs) {

    const size = (fs || 9.5) * s;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(BODY[0], BODY[1], BODY[2]);

    items.forEach(item => {

        const lines = doc.splitTextToSize(String(item), w - 5);

        doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.circle(x + 1.2, y - size * 0.115, 0.6, "F");

        doc.text(lines, x + 4.5, y);

        y += lines.length * lh(size) + 1.3 * s;
    });

    return y;
}

function pill(doc, text, x, y, fill, color, s) {

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5 * s);

    const w = doc.getTextWidth(text) + 8;

    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.roundedRect(x, y, w, 7 * s, 3 * s, 3 * s, "F");

    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(text, x + 4, y + 4.9 * s);

    return w;
}

function noteBox(doc, text, y, s, tone) {

    const palette = tone === "red"
        ? { fill: [253, 236, 234], text: [160, 50, 40] }
        : { fill: [253, 245, 232], text: [140, 100, 40] };

    const size = 9 * s;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);

    const lines = doc.splitTextToSize(String(text), CW - 10);
    const boxH = lines.length * lh(size) + 5.5 * s;

    doc.setFillColor(palette.fill[0], palette.fill[1], palette.fill[2]);
    doc.roundedRect(MARGIN, y, CW, boxH, 2, 2, "F");

    doc.setTextColor(palette.text[0], palette.text[1], palette.text[2]);
    doc.text(lines, MARGIN + 5, y + 4.6 * s);

    return y + boxH + 1 * s;
}

/* Two-column grid of "label / value" facts. */
function factsGrid(doc, facts, y, s) {

    const gap = 6;
    const cellW = (CW - gap) / 2;

    for (let i = 0; i < facts.length; i += 2) {

        let rowH = 0;

        [facts[i], facts[i + 1]].forEach((fact, col) => {

            if (!fact) return;

            const x = MARGIN + col * (cellW + gap);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5 * s);
            doc.setTextColor(GREY[0], GREY[1], GREY[2]);
            doc.text(fact[0], x, y);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(9.5 * s);
            doc.setTextColor(DARK[0], DARK[1], DARK[2]);

            const lines = doc.splitTextToSize(String(fact[1]), cellW);
            doc.text(lines, x, y + 4.2 * s);

            rowH = Math.max(rowH, 4.2 * s + lines.length * lh(9.5 * s));
        });

        y += rowH + 1.6 * s;
    }

    return y;
}

/* =========================================================
   DATA HELPERS
   ========================================================= */

function normKey(text) {
    return String(text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function animalKeyOf(animal) {

    const a = String(animal || "").toLowerCase();

    if (["cow", "buffalo", "cattle", "bovine"].includes(a)) return "cattle";

    return a;
}

function dateString() {

    return new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

/* Age saved by the age page, only if it belongs to this breed. */
function readAge(result) {

    try {

        const stored = JSON.parse(
            sessionStorage.getItem("vetvisionRecommendationResult") || "null"
        );

        if (!stored) return null;

        if (normKey(stored.breed) !== normKey(result.breed)) return null;

        const age = Number(stored.age);

        if (!Number.isFinite(age) || age < 0) return null;

        return { age: age, unit: stored.ageUnit === "months" ? "months" : "years" };

    } catch (error) {
        return null;
    }
}

function formatAge(ageInfo) {

    const unit = ageInfo.age === 1
        ? ageInfo.unit.replace(/s$/, "")
        : ageInfo.unit;

    return ageInfo.age + " " + unit;
}

function ageGroupLocal(animal, age, unit) {

    const rule = AGE_RULES[animal] || AGE_RULES.dog;

    const years = unit === "months" ? age / 12 : age;

    if (years < rule[0]) return "young";
    if (years >= rule[1]) return "senior";

    return "adult";
}

/* Care advice from the same backend function the app already uses. */
async function fetchCare(result, ageInfo) {

    const base =
        (window.VETVISION_API_BASE_URL ||
            "http://" + (window.location.hostname || "127.0.0.1") + ":5000")
            .replace(/\/$/, "");

    const body = {
        animal: result.animalType,
        breed: result.lowConfidence ? "unknown" : (result.breed || "unknown")
    };

    if (ageInfo) {
        body.age = ageInfo.age;
        body.age_unit = ageInfo.unit;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {

        const response = await fetch(base + "/api/recommend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal
        });

        if (!response.ok) return null;

        return await response.json();

    } catch (error) {

        return null;

    } finally {

        clearTimeout(timer);
    }
}

/* If the top two predictions are within 10 points, report the runner-up. */
function closeSecond(list) {

    const top = normalizeTop3(list);

    if (top.length < 2) return "";

    if (top[0].num === null || top[1].num === null) return "";

    if (top[0].num - top[1].num > 0.10) return "";

    return top[1].label + " (" + top[1].value + ")";
}

function normalizeTop3(list) {

    if (!Array.isArray(list)) return [];

    return list
        .map(item => {

            let label;
            let value;

            if (Array.isArray(item)) {
                label = item[0];
                value = item[1];
            } else if (item && typeof item === "object") {
                label =
                    item.breed_display || item.breed || item.disease ||
                    item.label || item.name || item.class;
                value =
                    item.confidence !== undefined ? item.confidence :
                    item.probability !== undefined ? item.probability :
                    item.score !== undefined ? item.score : item.prob;
            } else {
                label = item;
                value = null;
            }

            if (!label) return null;

            const number = Number(value);
            const valid = value !== null && value !== undefined && value !== "" && Number.isFinite(number);

            return {
                label: prettyLabel(label),
                value: formatPercent(value),
                num: valid ? (number <= 1 ? number : number / 100) : null
            };
        })
        .filter(Boolean)
        .slice(0, 3);
}

function getImageSize(src) {

    return new Promise((resolve, reject) => {

        const img = new Image();

        img.onload = () => resolve({
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height
        });

        img.onerror = () => reject(new Error("Image failed to load."));

        img.src = src;
    });
}

function formatPercent(value) {

    if (value === null || value === undefined || value === "") return null;

    const number = Number(value);

    if (!Number.isFinite(number)) return String(value);

    return (number <= 1 ? number * 100 : number).toFixed(1) + "%";
}

function prettyLabel(text) {

    return String(text || "")
        .replace(/[_-]+/g, " ")
        .trim()
        .replace(/\b\w/g, c => c.toUpperCase());
}

function capitalize(text) {
    text = String(text || "");
    return text.charAt(0).toUpperCase() + text.slice(1);
}