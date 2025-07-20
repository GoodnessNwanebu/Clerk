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
    name: "General Surgery",
    icon: "scissors",
    gradient: "from-green-500 to-green-700",
    description: "Surgical treatment of various conditions and injuries.",
    avatar: "/avatars/general-surgery.svg"
  },
  {
    name: "Cardiothoracic Surgery",
    icon: "heart",
    gradient: "from-red-500 to-red-700",
    description: "Surgery of the heart, lungs, and chest cavity.",
    avatar: "/avatars/cardiothoracic-surgery.svg"
  }
]; 