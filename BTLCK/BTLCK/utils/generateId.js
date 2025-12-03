// utils/generateId.js
const generateId = (prefix) => {
  return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 4)}`;
};

module.exports = generateId;