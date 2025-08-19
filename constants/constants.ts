import { Department } from './../types';

export const DEPARTMENTS: Department[] = [
  {
    name: "Obstetrics",
    icon: "user",
    gradient: "from-pink-500 to-pink-700",
    description: "Care during pregnancy, childbirth, and postpartum.",
    avatar: "/avatars/obstetrics.svg"
  },
  {
    name: "Gynecology",
    icon: "venus",
    gradient: "from-purple-500 to-purple-700",
    description: "Health of the female reproductive system.",
    avatar: "/avatars/gynecology.svg"
  },
  {
    name: "Pediatrics",
    icon: "baby",
    gradient: "from-blue-500 to-blue-700",
    description: "Medical care of infants, children, and adolescents.",
    avatar: "/avatars/pediatrics.svg"
  },
  {
    name: "Internal Medicine",
    icon: "stethoscope",
    gradient: "from-indigo-500 to-indigo-700",
    description: "Comprehensive medical care for adults.",
    avatar: "/avatars/internal-medicine.svg",
    subspecialties: [
      {
        name: "Cardiology",
        icon: "heart",
        gradient: "from-red-500 to-red-700",
        description: "Heart and cardiovascular system",
        avatar: "/avatars/cardiology.svg"
      },
      {
        name: "Endocrinology",
        icon: "activity",
        gradient: "from-orange-500 to-orange-700",
        description: "Hormones and metabolism",
        avatar: "/avatars/endocrinology.svg"
      },
      {
        name: "Rheumatology",
        icon: "zap",
        gradient: "from-yellow-500 to-yellow-700",
        description: "Joint and autoimmune diseases",
        avatar: "/avatars/rheumatology.svg"
      },
      {
        name: "Neurology",
        icon: "brain",
        gradient: "from-purple-500 to-purple-700",
        description: "Nervous system disorders",
        avatar: "/avatars/neurology.svg"
      },
      {
        name: "Nephrology",
        icon: "droplets",
        gradient: "from-cyan-500 to-cyan-700",
        description: "Kidney diseases",
        avatar: "/avatars/nephrology.svg"
      },
      {
        name: "Gastroenterology",
        icon: "stomach",
        gradient: "from-emerald-500 to-emerald-700",
        description: "Digestive system disorders",
        avatar: "/avatars/gastroenterology.svg"
      },
      {
        name: "Respiratory",
        icon: "wind",
        gradient: "from-sky-500 to-sky-700",
        description: "Lung and breathing disorders",
        avatar: "/avatars/respiratory.svg"
      },
      {
        name: "Radiology",
        icon: "scan",
        gradient: "from-slate-500 to-slate-700",
        description: "Medical imaging and diagnosis",
        avatar: "/avatars/radiology.svg"
      },
      {
        name: "Dermatology",
        icon: "shield",
        gradient: "from-amber-500 to-amber-700",
        description: "Skin conditions and diseases",
        avatar: "/avatars/dermatology.svg"
      },
      {
        name: "Psychiatry",
        icon: "mind",
        gradient: "from-violet-500 to-violet-700",
        description: "Mental health and behavioral disorders",
        avatar: "/avatars/psychiatry.svg"
      },
      {
        name: "Infectious",
        icon: "bug",
        gradient: "from-lime-500 to-lime-700",
        description: "Infectious diseases and microbiology",
        avatar: "/avatars/infectious.svg"
      }
    ]
  },
  {
    name: "Surgery",
    icon: "scissors",
    gradient: "from-green-500 to-green-700",
    description: "Surgical treatment and procedures.",
    avatar: "/avatars/surgery.svg",
    subspecialties: [
      {
        name: "General Surgery",
        icon: "scissors",
        gradient: "from-green-500 to-green-700",
        description: "General surgical procedures",
        avatar: "/avatars/general-surgery.svg"
      },
      {
        name: "ENT Surgery",
        icon: "ear",
        gradient: "from-cyan-500 to-cyan-700",
        description: "Ear, nose, and throat surgery",
        avatar: "/avatars/ent-surgery.svg"
      },
      {
        name: "Ophthalmology",
        icon: "eye",
        gradient: "from-blue-500 to-blue-700",
        description: "Eye surgery and vision care",
        avatar: "/avatars/ophthalmology.svg"
      },
      {
        name: "Anesthesiology",
        icon: "zap-off",
        gradient: "from-gray-500 to-gray-700",
        description: "Anesthesia and pain management",
        avatar: "/avatars/anesthesiology.svg"
      },
      {
        name: "Orthopedics",
        icon: "bone",
        gradient: "from-stone-500 to-stone-700",
        description: "Bone and joint surgery",
        avatar: "/avatars/orthopedics.svg"
      },
      {
        name: "Neurosurgery",
        icon: "brain",
        gradient: "from-purple-500 to-purple-700",
        description: "Brain and spine surgery",
        avatar: "/avatars/neurosurgery.svg"
      },
      {
        name: "Plastic Surgery",
        icon: "sparkles",
        gradient: "from-pink-500 to-pink-700",
        description: "Reconstructive and cosmetic surgery",
        avatar: "/avatars/plastic-surgery.svg"
      },
      {
        name: "Urology",
        icon: "droplet",
        gradient: "from-teal-500 to-teal-700",
        description: "Urinary system surgery",
        avatar: "/avatars/urology.svg"
      },
      {
        name: "Cardiothoracic",
        icon: "heart",
        gradient: "from-red-500 to-red-700",
        description: "Heart, lung, and chest surgery",
        avatar: "/avatars/cardiothoracic-surgery.svg"
      }
    ]
  }
];

// Medical pearls for loading screens - organized by department
export const MEDICAL_PEARLS = {
  general: [
  "Always listen to the patient - they're telling you the diagnosis.",
  "Common things are common, but don't forget the zebras.",
  "When you hear hoofbeats, think horses, not zebras.",
  "The patient is the most important person in the room.",
  "A good history is 80% of the diagnosis.",
  "If you don't take a temperature, you can't find a fever.",
  "The eyes don't see what the mind doesn't know.",
  "Treat the patient, not the numbers.",
  "Time is the great diagnostician.",
  "The best test is the one you know how to interpret.",
  "When in doubt, examine the patient again.",
  "The most expensive test is the one you don't need.",
  "Listen to the patient's story - it's the most important diagnostic tool.",
  "Physical examination is the most cost-effective diagnostic test.",
  "The patient's own words are often the most revealing.",
  "Don't let the perfect be the enemy of the good.",
  "The best medicine is prevention.",
  "Trust your clinical instincts, but verify with evidence.",
  "Every patient is a teacher.",
  "The art of medicine is in the details."
  ],
  cardiology: [
    "In chest pain, always ask about radiation to the arm, jaw, or back.",
    "Check for JVP with patient at 45 degrees - look for the double waveform.",
    "Listen for S3/S4 gallops - they're subtle but important signs of heart failure.",
    "Don't forget to check peripheral pulses - weak pulses suggest poor cardiac output.",
    "Ask about exertional symptoms - what stops them from their usual activities?",
    "Check for ankle edema and ask about orthopnea - classic heart failure symptoms.",
    "Listen to the heart in multiple positions - mitral murmurs are best heard in lateral decubitus.",
    "Ask about family history of sudden cardiac death - crucial for risk assessment.",
    "Check blood pressure in both arms - significant difference suggests aortic dissection.",
    "Look for signs of endocarditis - splinter hemorrhages, Janeway lesions, Osler nodes."
  ],
  neurology: [
    "Always check pupils - size, shape, and reactivity can localize the lesion.",
    "Test cranial nerves systematically - start with II, then III, IV, VI.",
    "Look for facial asymmetry - subtle weakness can be the only sign of stroke.",
    "Check for pronator drift - a sensitive test for upper motor neuron lesions.",
    "Test sensation with a pin - start distally and work proximally.",
    "Check reflexes - hyperreflexia suggests upper motor neuron disease.",
    "Look for nystagmus - direction and type help localize the lesion.",
    "Test coordination with finger-nose-finger - cerebellar signs are often subtle.",
    "Check for Romberg sign - positive suggests proprioceptive loss.",
    "Look for tremor - rest vs. intention helps differentiate Parkinson's from cerebellar disease."
  ],
  pediatrics: [
    "Always assess the child's developmental stage - expectations change with age.",
    "Check vital signs against age-appropriate norms - different from adults.",
    "Look at the child's behavior - are they playing normally?",
    "Check fontanelles in infants - bulging suggests increased intracranial pressure.",
    "Assess hydration status - capillary refill and tears are key indicators.",
    "Look for signs of respiratory distress - nasal flaring, grunting, retractions.",
    "Check for rashes - distribution and characteristics matter.",
    "Assess growth parameters - plot on growth charts.",
    "Look for signs of abuse - unexplained bruises, burns, or fractures.",
    "Check immunization status - crucial for preventing serious infections."
  ],
  surgery: [
    "Always check for signs of peritonitis - rebound tenderness is a red flag.",
    "Look for surgical scars - they tell the patient's history.",
    "Check for hernias - have the patient cough while you palpate.",
    "Assess bowel sounds - absent sounds suggest ileus or obstruction.",
    "Check for Murphy's sign in RUQ pain - suggests cholecystitis.",
    "Look for signs of appendicitis - McBurney's point tenderness.",
    "Check for signs of obstruction - distension, high-pitched bowel sounds.",
    "Assess for signs of bleeding - look for pallor, tachycardia, hypotension.",
    "Check for signs of infection - fever, leukocytosis, local signs.",
    "Look for signs of ischemia - pain out of proportion to exam."
  ],
  internal_medicine: [
    "Always check for signs of systemic disease - look beyond the obvious.",
    "Assess functional status - what can they do vs. what they used to do?",
    "Check for signs of infection - fever, leukocytosis, local signs.",
    "Look for signs of malignancy - weight loss, night sweats, fatigue.",
    "Check for signs of endocrine disease - thyroid, diabetes, adrenal.",
    "Assess for signs of autoimmune disease - joint pain, rash, fatigue.",
    "Look for signs of liver disease - jaundice, ascites, asterixis.",
    "Check for signs of kidney disease - edema, hypertension, proteinuria.",
    "Assess for signs of lung disease - dyspnea, cough, sputum.",
    "Look for signs of heart disease - chest pain, dyspnea, edema."
  ],
  emergency: [
    "Always think ABCDE - Airway, Breathing, Circulation, Disability, Exposure.",
    "Check vital signs first - they guide your entire assessment.",
    "Look for signs of shock - tachycardia, hypotension, altered mental status.",
    "Assess for signs of trauma - mechanism of injury matters.",
    "Check for signs of poisoning - altered mental status, unusual odors.",
    "Look for signs of infection - fever, leukocytosis, local signs.",
    "Assess for signs of cardiac disease - chest pain, dyspnea, syncope.",
    "Check for signs of neurological emergency - headache, weakness, altered mental status.",
    "Look for signs of respiratory distress - dyspnea, hypoxia, accessory muscle use.",
    "Assess for signs of bleeding - pallor, tachycardia, hypotension."
  ]
};

// Helper function to get pearls for a specific department
export const getPearlsForDepartment = (department: string): string[] => {
  const deptKey = department.toLowerCase().replace(/\s+/g, '_');
  return MEDICAL_PEARLS[deptKey as keyof typeof MEDICAL_PEARLS] || MEDICAL_PEARLS.general;
}; 