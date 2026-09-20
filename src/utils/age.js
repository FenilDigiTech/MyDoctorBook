/**
 * Calculates exact age in years from a Date of Birth (DOB) string.
 * Automatically updates as time/years pass!
 * @param {string} dobString - Date of birth in YYYY-MM-DD format
 * @returns {number|string} Calculated age in years
 */
export const calculateAge = (dobString) => {
  if (!dobString) return '';
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return '';
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
};
