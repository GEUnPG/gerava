// utils/validators.js
function isValidDate(dateStr) {
  const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
  if (!regex.test(dateStr)) return false;
  const [day, month, year] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
}

function isValidNumber(value) {
  const num = parseInt(value);
  return !isNaN(num) && num > 0;
}

module.exports = {
  isValidDate,
  isValidNumber,
};
