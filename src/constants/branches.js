/**
 * Authoritative Academic Branch Taxonomy and Constants
 * 
 * Rules:
 * 1. Final normal academic branches: AIDS, CSM, CSD, CSC, CAI (No AIML)
 * 2. CSM filter includes CSM + AIML books on backend
 * 3. KIET Women's Library allows ONLY: AIDS, CAI, CSM
 */

export const ACADEMIC_BRANCHES = [
  { value: 'AIDS', label: 'AIDS — AI & Data Science', shortLabel: 'AIDS' },
  { value: 'CSM', label: 'CSM — Computer Science & ML', shortLabel: 'CSM' },
  { value: 'CSD', label: 'CSD — Computer Science & Data Science', shortLabel: 'CSD' },
  { value: 'CSC', label: 'CSC — CS & Cybersecurity', shortLabel: 'CSC' },
  { value: 'CAI', label: 'CAI — Computer Science & AI', shortLabel: 'CAI' },
];

export const WOMEN_LIBRARY_BRANCH_VALUES = ['AIDS', 'CAI', 'CSM'];

/**
 * Check if a library code or library name corresponds to KIET Women's Library
 */
export const isWomenLibrary = (libraryCodeOrIdOrObj) => {
  if (!libraryCodeOrIdOrObj) return false;
  
  if (typeof libraryCodeOrIdOrObj === 'object') {
    const code = libraryCodeOrIdOrObj.code || '';
    const name = libraryCodeOrIdOrObj.name || '';
    const isWomen = Boolean(libraryCodeOrIdOrObj.isWomenOnly);
    return isWomen || code === 'KIET_WOMEN' || name.toLowerCase().includes('women');
  }

  const str = String(libraryCodeOrIdOrObj).trim();
  return str === 'KIET_WOMEN' || str.toLowerCase().includes('women');
};

/**
 * Returns allowed branch options array based on selected library
 */
export const getAllowedBranches = (selectedLibrary) => {
  if (isWomenLibrary(selectedLibrary)) {
    // Return restricted list for Women's Library: AIDS, CAI, CSM
    return ACADEMIC_BRANCHES.filter((b) => WOMEN_LIBRARY_BRANCH_VALUES.includes(b.value))
      .sort((a, b) => WOMEN_LIBRARY_BRANCH_VALUES.indexOf(a.value) - WOMEN_LIBRARY_BRANCH_VALUES.indexOf(b.value));
  }
  
  return ACADEMIC_BRANCHES;
};

/**
 * Checks if selected branch is valid for given library
 */
export const isBranchValidForLibrary = (branchValue, selectedLibrary) => {
  if (!branchValue) return true; // All Branches is always valid
  const allowed = getAllowedBranches(selectedLibrary).map((b) => b.value);
  return allowed.includes(branchValue.toUpperCase());
};
