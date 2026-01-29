// admin/src/utils/auth.js

/**
 * Get authentication token from localStorage
 * @returns {string|null} JWT token or null if not found
 */
export const getAuthToken = () => {
  try {
    const sessionData = localStorage.getItem('adminSession');
    if (sessionData) {
      const { token } = JSON.parse(sessionData);
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Get admin user data from localStorage
 * @returns {object|null} User object or null if not found
 */
export const getAdminUser = () => {
  try {
    const sessionData = localStorage.getItem('adminSession');
    if (sessionData) {
      const { user } = JSON.parse(sessionData);
      return user;
    }
    return null;
  } catch (error) {
    console.error('Error getting admin user:', error);
    return null;
  }
};

/**
 * Check if admin is authenticated
 * @returns {boolean} True if token exists
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  return token !== null && token !== undefined && token.trim() !== '';
};

/**
 * Save admin session to localStorage
 * @param {string} token - JWT token
 * @param {object} user - User object
 */
export const saveAdminSession = (token, user) => {
  try {
    const sessionData = {
      token,
      user,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('adminSession', JSON.stringify(sessionData));
    console.log('✅ Admin session saved successfully');
  } catch (error) {
    console.error('Error saving admin session:', error);
  }
};
/**
 * Clear admin session from localStorage
 */
export const clearAdminSession = () => {
  try {
    localStorage.removeItem('adminSession');
    console.log('✅ Admin session cleared');
  } catch (error) {
    console.error('Error clearing admin session:', error);
  }
};
/**
 * Get authorization headers for API requests
 * @returns {object} Headers object with Authorization
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  if (!token) {
    console.warn('⚠️ No auth token found');
    return {};
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};