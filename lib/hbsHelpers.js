const moment = require('moment');
const prettyBytes = require('pretty-bytes');

exports.section = function (name, options) {
  if (!this._sections) this._sections = {};
  this._sections[name] = options.fn(this);
};

exports.bytes = function (value) {
  return Number.isFinite(value) ? prettyBytes(value) : '';
};

exports.add = function (a, b) {
  return a + b;
};

exports.moment = function (date, format) {
  return moment(date).format(format);
};

exports.eq = function (a, b, options) {
  return a === b ? options.fn(this) : options.inverse(this);
};

exports.isnt = function (a, b, options) {
  return a !== b ? options.fn(this) : options.inverse(this);
};
