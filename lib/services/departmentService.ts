import type { Department } from '../../types';

export interface DepartmentWithSubspecialties {
  id: string;
  name: string;
  subspecialties: Array<{
    id: string;
    name: string;
  }>;
}

export interface DepartmentsResponse {
  success: boolean;
  departments: DepartmentWithSubspecialties[];
  error?: string;
}

export async function fetchDepartments(): Promise<DepartmentWithSubspecialties[]> {
  try {
    const response = await fetch('/api/departments', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch departments: ${response.statusText}`);
    }

    const data: DepartmentsResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch departments');
    }

    return data.departments;
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
}

// Transform database departments to match the frontend Department type
export function transformDepartmentsForFrontend(
  dbDepartments: DepartmentWithSubspecialties[]
): Department[] {
  return dbDepartments.map(dept => {
    // Get the department metadata from constants (icons, gradients, etc.)
    const departmentMetadata = getDepartmentMetadata(dept.name);
    
    return {
      ...departmentMetadata,
      name: dept.name,
      icon: departmentMetadata.icon || 'stethoscope',
      gradient: departmentMetadata.gradient || 'from-gray-500 to-gray-700',
      description: departmentMetadata.description || 'Medical department.',
      avatar: departmentMetadata.avatar || '/avatars/default.svg',
      subspecialties: dept.subspecialties.map(sub => {
        const subspecialtyMetadata = getSubspecialtyMetadata(dept.name, sub.name);
        return {
          ...subspecialtyMetadata,
          name: sub.name,
          icon: subspecialtyMetadata.icon || 'stethoscope',
          gradient: subspecialtyMetadata.gradient || 'from-gray-500 to-gray-700',
          description: subspecialtyMetadata.description || 'Medical subspecialty.',
          avatar: subspecialtyMetadata.avatar || '/avatars/default.svg',
        };
      }),
    };
  });
}

// Helper function to check if a department has subspecialties
export function hasSubspecialties(departmentName: string): boolean {
  const departmentsWithSubspecialties = [
    'Pediatrics',
    'Internal Medicine', 
    'Surgery'
  ];
  
  return departmentsWithSubspecialties.includes(departmentName);
}

// Helper function to get the parent department name from a subspecialty name
export function getParentDepartment(subspecialtyName: string): string {
  const subspecialtyToDepartmentMap: Record<string, string> = {
    // Pediatrics subspecialties
    'Neonatology': 'Pediatrics',
    'Pediatric Cardiology': 'Pediatrics',
    'Pediatric Endocrinology': 'Pediatrics',
    'Pediatric Neurology': 'Pediatrics',
    'Pediatric Oncology': 'Pediatrics',
    'Pediatric Emergency Medicine': 'Pediatrics',
    'Infectious Diseases': 'Pediatrics',
    'Pediatric Psychiatry': 'Pediatrics',
    'Pediatric Community Medicine': 'Pediatrics',
    'Pediatric Nephrology': 'Pediatrics',
    'Pediatric Gastroenterology': 'Pediatrics',
    'Pediatric Hematology': 'Pediatrics',
    'Pediatric Infectious Diseases': 'Pediatrics',
    'Pediatric Pulmonology': 'Pediatrics',
    
    // Internal Medicine subspecialties
    'Cardiology': 'Internal Medicine',
    'Endocrinology': 'Internal Medicine',
    'Rheumatology': 'Internal Medicine',
    'Neurology': 'Internal Medicine',
    'Nephrology': 'Internal Medicine',
    'Gastroenterology': 'Internal Medicine',
    'Respiratory': 'Internal Medicine',
    'Radiology': 'Internal Medicine',
    'Dermatology': 'Internal Medicine',
    'Psychiatry': 'Internal Medicine',
    'Infectious': 'Internal Medicine',
    
    // Surgery subspecialties
    'General Surgery': 'Surgery',
    'ENT Surgery': 'Surgery',
    'Ophthalmology': 'Surgery',
    'Anesthesiology': 'Surgery',
    'Orthopedics': 'Surgery',
    'Neurosurgery': 'Surgery',
    'Plastic Surgery': 'Surgery',
    'Urology': 'Surgery',
    'Cardiothoracic': 'Surgery',
    'Pediatric Surgery': 'Surgery'
  };
  
  return subspecialtyToDepartmentMap[subspecialtyName] || subspecialtyName;
}

// Helper function to get department metadata (icons, gradients, etc.)
function getDepartmentMetadata(departmentName: string) {
  const metadataMap: Record<string, Partial<Department>> = {
    'Obstetrics': {
      icon: 'user',
      gradient: 'from-pink-500 to-pink-700',
      description: 'Care during pregnancy, childbirth, and postpartum.',
      avatar: '/avatars/obstetrics.svg'
    },
    'Gynecology': {
      icon: 'venus',
      gradient: 'from-purple-500 to-purple-700',
      description: 'Health of the female reproductive system.',
      avatar: '/avatars/gynecology.svg'
    },
    'Pediatrics': {
      icon: 'baby',
      gradient: 'from-blue-500 to-blue-700',
      description: 'Medical care of infants, children, and adolescents.',
      avatar: '/avatars/pediatrics.svg'
    },
    'Internal Medicine': {
      icon: 'stethoscope',
      gradient: 'from-indigo-500 to-indigo-700',
      description: 'Comprehensive medical care for adults.',
      avatar: '/avatars/internal-medicine.svg'
    },
    'Surgery': {
      icon: 'scissors',
      gradient: 'from-green-500 to-green-700',
      description: 'Surgical treatment and procedures.',
      avatar: '/avatars/surgery.svg'
    },
    'Dentistry': {
      icon: 'tooth',
      gradient: 'from-teal-500 to-teal-700',
      description: 'Oral health and dental care.',
      avatar: '/avatars/dentistry.svg'
    }
  };

  return metadataMap[departmentName] || {
    icon: 'stethoscope',
    gradient: 'from-gray-500 to-gray-700',
    description: 'Medical department.',
    avatar: '/avatars/default.svg'
  };
}

// Helper function to get subspecialty metadata
function getSubspecialtyMetadata(departmentName: string, subspecialtyName: string) {
  const metadataMap: Record<string, Record<string, Partial<Department>>> = {
    'Pediatrics': {
      'Neonatology': {
        icon: 'baby',
        gradient: 'from-pink-500 to-pink-700',
        description: 'Care for newborns and premature infants',
        avatar: '/avatars/neonatology.svg'
      },
      'Pediatric Cardiology': {
        icon: 'heart',
        gradient: 'from-red-500 to-red-700',
        description: 'Heart conditions in children',
        avatar: '/avatars/pediatric-cardiology.svg'
      },
      'Pediatric Endocrinology': {
        icon: 'activity',
        gradient: 'from-orange-500 to-orange-700',
        description: 'Hormonal disorders in children',
        avatar: '/avatars/pediatric-endocrinology.svg'
      },
      'Pediatric Neurology': {
        icon: 'brain',
        gradient: 'from-purple-500 to-purple-700',
        description: 'Neurological disorders in children',
        avatar: '/avatars/pediatric-neurology.svg'
      },
      'Pediatric Oncology': {
        icon: 'shield',
        gradient: 'from-indigo-500 to-indigo-700',
        description: 'Cancer treatment in children',
        avatar: '/avatars/pediatric-oncology.svg'
      },
      'Pediatric Emergency Medicine': {
        icon: 'zap',
        gradient: 'from-yellow-500 to-yellow-700',
        description: 'Emergency care for children',
        avatar: '/avatars/pediatric-emergency.svg'
      },
      'Pediatric Surgery': {
        icon: 'scissors',
        gradient: 'from-green-500 to-green-700',
        description: 'Surgical procedures for children',
        avatar: '/avatars/pediatric-surgery.svg'
      },
      'Pediatric Psychiatry': {
        icon: 'mind',
        gradient: 'from-violet-500 to-violet-700',
        description: 'Mental health in children and adolescents',
        avatar: '/avatars/pediatric-psychiatry.svg'
      },
      'Pediatric Gastroenterology': {
        icon: 'stomach',
        gradient: 'from-emerald-500 to-emerald-700',
        description: 'Digestive disorders in children',
        avatar: '/avatars/pediatric-gastroenterology.svg'
      },
      'Pediatric Nephrology': {
        icon: 'droplets',
        gradient: 'from-cyan-500 to-cyan-700',
        description: 'Kidney diseases in children',
        avatar: '/avatars/pediatric-nephrology.svg'
      },
      'Pediatric Hematology': {
        icon: 'droplet',
        gradient: 'from-red-500 to-red-700',
        description: 'Blood disorders in children',
        avatar: '/avatars/pediatric-hematology.svg'
      },
      'Pediatric Infectious Diseases': {
        icon: 'bug',
        gradient: 'from-lime-500 to-lime-700',
        description: 'Infectious diseases in children',
        avatar: '/avatars/pediatric-infectious.svg'
      },
      'Pediatric Pulmonology': {
        icon: 'wind',
        gradient: 'from-sky-500 to-sky-700',
        description: 'Lung and respiratory disorders in children',
        avatar: '/avatars/pediatric-pulmonology.svg'
      },
      'Pediatric Community Medicine': {
        icon: 'users',
        gradient: 'from-indigo-500 to-indigo-700',
        description: 'Community health and preventive care for children',
        avatar: '/avatars/pediatric-community.svg'
      },
      'Infectious Diseases': {
        icon: 'bug',
        gradient: 'from-lime-500 to-lime-700',
        description: 'Infectious diseases in children',
        avatar: '/avatars/pediatric-infectious.svg'
      }
    },
    'Internal Medicine': {
      'Cardiology': {
        icon: 'heart',
        gradient: 'from-red-500 to-red-700',
        description: 'Heart and cardiovascular system',
        avatar: '/avatars/cardiology.svg'
      },
      'Endocrinology': {
        icon: 'activity',
        gradient: 'from-orange-500 to-orange-700',
        description: 'Hormones and metabolism',
        avatar: '/avatars/endocrinology.svg'
      },
      'Rheumatology': {
        icon: 'zap',
        gradient: 'from-yellow-500 to-yellow-700',
        description: 'Joint and autoimmune diseases',
        avatar: '/avatars/rheumatology.svg'
      },
      'Neurology': {
        icon: 'brain',
        gradient: 'from-purple-500 to-purple-700',
        description: 'Nervous system disorders',
        avatar: '/avatars/neurology.svg'
      },
      'Nephrology': {
        icon: 'droplets',
        gradient: 'from-cyan-500 to-cyan-700',
        description: 'Kidney diseases',
        avatar: '/avatars/nephrology.svg'
      },
      'Gastroenterology': {
        icon: 'stomach',
        gradient: 'from-emerald-500 to-emerald-700',
        description: 'Digestive system disorders',
        avatar: '/avatars/gastroenterology.svg'
      },
      'Respiratory': {
        icon: 'wind',
        gradient: 'from-sky-500 to-sky-700',
        description: 'Lung and breathing disorders',
        avatar: '/avatars/respiratory.svg'
      },
      'Radiology': {
        icon: 'scan',
        gradient: 'from-slate-500 to-slate-700',
        description: 'Medical imaging and diagnosis',
        avatar: '/avatars/radiology.svg'
      },
      'Dermatology': {
        icon: 'shield',
        gradient: 'from-amber-500 to-amber-700',
        description: 'Skin conditions and diseases',
        avatar: '/avatars/dermatology.svg'
      },
      'Psychiatry': {
        icon: 'mind',
        gradient: 'from-violet-500 to-violet-700',
        description: 'Mental health and behavioral disorders',
        avatar: '/avatars/psychiatry.svg'
      },
      'Infectious': {
        icon: 'bug',
        gradient: 'from-lime-500 to-lime-700',
        description: 'Infectious diseases and microbiology',
        avatar: '/avatars/infectious.svg'
      }
    },
    'Surgery': {
      'General Surgery': {
        icon: 'scissors',
        gradient: 'from-green-500 to-green-700',
        description: 'General surgical procedures',
        avatar: '/avatars/general-surgery.svg'
      },
      'ENT Surgery': {
        icon: 'ear',
        gradient: 'from-cyan-500 to-cyan-700',
        description: 'Ear, nose, and throat surgery',
        avatar: '/avatars/ent-surgery.svg'
      },
      'Ophthalmology': {
        icon: 'eye',
        gradient: 'from-blue-500 to-blue-700',
        description: 'Eye surgery and vision care',
        avatar: '/avatars/ophthalmology.svg'
      },
      'Anesthesiology': {
        icon: 'zap-off',
        gradient: 'from-gray-500 to-gray-700',
        description: 'Anesthesia and pain management',
        avatar: '/avatars/anesthesiology.svg'
      },
      'Orthopedics': {
        icon: 'bone',
        gradient: 'from-stone-500 to-stone-700',
        description: 'Bone and joint surgery',
        avatar: '/avatars/orthopedics.svg'
      },
      'Neurosurgery': {
        icon: 'brain',
        gradient: 'from-purple-500 to-purple-700',
        description: 'Brain and spine surgery',
        avatar: '/avatars/neurosurgery.svg'
      },
      'Plastic Surgery': {
        icon: 'sparkles',
        gradient: 'from-pink-500 to-pink-700',
        description: 'Reconstructive and cosmetic surgery',
        avatar: '/avatars/plastic-surgery.svg'
      },
      'Urology': {
        icon: 'droplet',
        gradient: 'from-teal-500 to-teal-700',
        description: 'Urinary system surgery',
        avatar: '/avatars/urology.svg'
      },
      'Cardiothoracic': {
        icon: 'heart',
        gradient: 'from-red-500 to-red-700',
        description: 'Heart, lung, and chest surgery',
        avatar: '/avatars/cardiothoracic-surgery.svg'
      },
      'Pediatric Surgery': {
        icon: 'baby',
        gradient: 'from-blue-500 to-blue-700',
        description: 'Surgical procedures for children',
        avatar: '/avatars/pediatric-surgery.svg'
      }
    }
  };

  const departmentMetadata = metadataMap[departmentName];
  if (!departmentMetadata) {
    return {
      icon: 'stethoscope',
      gradient: 'from-gray-500 to-gray-700',
      description: 'Medical subspecialty',
      avatar: '/avatars/default.svg'
    };
  }

  return departmentMetadata[subspecialtyName] || {
    icon: 'stethoscope',
    gradient: 'from-gray-500 to-gray-700',
    description: 'Medical subspecialty',
    avatar: '/avatars/default.svg'
  };
}
