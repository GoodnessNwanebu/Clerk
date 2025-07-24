import { Department } from './types';

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
        avatar: "/avatars/cardiothoracic.svg"
      }
    ]
  }
]; 