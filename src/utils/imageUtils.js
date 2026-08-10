/**
 * Appends current JWT access token to static image URLs (e.g., /uploads/...)
 * to ensure protected image rendering in standard <img> HTML elements.
 * 
 * @param {string} url - Original photo URL
 * @returns {string} Protected photo URL with token query parameter
 */
export const getProtectedImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  
  const token = localStorage.getItem('accessToken');
  if (!token) return url;
  
  // If token is already appended, return as is
  if (url.includes('token=')) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${token}`;
};

export default getProtectedImageUrl;
