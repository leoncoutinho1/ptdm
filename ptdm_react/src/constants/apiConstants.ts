export const apiConstants = {
  API_URL: (window.env?.API_URL || 'http://localhost:5215/').replace(/\/$/, '') + '/',
};
