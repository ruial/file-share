exports.checkStringLength = function (minLength = 1) {
  return function (input) {
    return Boolean(input) && input.trim().length >= minLength;
  };
};

exports.isEmail = function (input) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input);
};
