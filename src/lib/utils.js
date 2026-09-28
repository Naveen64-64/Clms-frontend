import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Safely formats a roll number or student identifier to uppercase.
 * Handles edge cases safely: null, undefined, empty, numbers, mixed case.
 * Does not uppercase email addresses (contains '@') to preserve standard formatting.
 *
 * @param {string | number | null | undefined} val - Value to format
 * @returns {string} - Formatted uppercase roll number or safe original string
 */
export function formatRollNumber(val) {
  if (val == null) return '';
  const str = String(val).trim();
  if (!str) return '';
  if (str.includes('@')) {
    return str;
  }
  return str.toUpperCase();
}

/**
 * Resolves the student's assigned campus library dynamically based on their profile or roll number.
 * Mappings based on KDL institution codes:
 * - 'B2' -> KIET Library
 * - '6Q' -> KIET 2 Library
 * - 'JN' -> KIEW Library
 *
 * @param {object | string | null | undefined} studentOrRoll - Student profile object or roll number string
 * @returns {string} - Library name (e.g. 'KIET Library', 'KIET 2 Library', 'KIEW Library')
 */
export function getStudentAssignedLibrary(studentOrRoll) {
  if (!studentOrRoll) return 'KIET Library';

  if (typeof studentOrRoll === 'object') {
    if (studentOrRoll.assignedLibrary?.name) return studentOrRoll.assignedLibrary.name;
    if (studentOrRoll.campusCode === '6Q') return 'KIET 2 Library';
    if (studentOrRoll.campusCode === 'JN') return 'KIEW Library';
    if (studentOrRoll.campusCode === 'B2') return 'KIET Library';
    studentOrRoll = studentOrRoll.rollNumber || studentOrRoll.username || '';
  }

  const str = String(studentOrRoll).trim().toUpperCase();
  const match = str.match(/^\d{2}(B2|6Q|JN)/);
  if (match) {
    if (match[1] === '6Q') return 'KIET 2 Library';
    if (match[1] === 'JN') return 'KIEW Library';
    return 'KIET Library';
  }

  return 'KIET Library';
}
