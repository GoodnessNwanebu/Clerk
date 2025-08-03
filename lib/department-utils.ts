import { Department } from '../types';
import { DEPARTMENTS } from '../constants';

// Helper function to find department config by name (searches both departments and subspecialties)
export function getDepartmentConfig(name: string): Department | undefined {
  // First, try to find it as a main department
  const mainDepartment = DEPARTMENTS.find(dept => dept.name === name);
  if (mainDepartment) {
    return mainDepartment;
  }
  
  // If not found as main department, search through subspecialties
  for (const dept of DEPARTMENTS) {
    const subspecialty = dept.subspecialties?.find(sub => sub.name === name);
    if (subspecialty) {
      return subspecialty;
    }
  }
  
  return undefined;
}

// Helper function to find subspecialty config by name and department
export function getSubspecialtyConfig(name: string, departmentName: string): any | undefined {
  const deptConfig = getDepartmentConfig(departmentName);
  return deptConfig?.subspecialties?.find(sub => sub.name === name);
} 