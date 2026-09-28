import { useMemo } from 'react';
import { getAllowedBranches, isBranchValidForLibrary, isWomenLibrary } from '../constants/branches';

/**
 * Custom Hook for Academic Branches
 * @param {string|object} selectedLibrary - Library code, ID, or object
 * @returns {object} { allowedBranches, isWomenLib, isValidBranch, sanitizeBranch }
 */
export const useAcademicBranches = (selectedLibrary = '', customBranches = null) => {
  const isWomenLib = useMemo(() => isWomenLibrary(selectedLibrary), [selectedLibrary]);
  
  const allowedBranches = useMemo(() => {
    return getAllowedBranches(selectedLibrary);
  }, [selectedLibrary]);

  const isValidBranch = (branchValue) => {
    if (!branchValue) return true;
    return allowedBranches.some((b) => b.value.toUpperCase() === branchValue.toUpperCase());
  };

  const sanitizeBranch = (currentBranch) => {
    if (!currentBranch) return '';
    return isValidBranch(currentBranch) ? currentBranch : '';
  };

  return {
    allowedBranches,
    isWomenLib,
    isValidBranch,
    sanitizeBranch
  };
};

export default useAcademicBranches;
