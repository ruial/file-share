const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const errorHandler = require('../lib/mongooseErrorHandler');
const validate = require('../lib/validate');

const SALT_ROUNDS = 10;
const TOKEN_LENGTH = 16; // 16 bytes = 32 hex characters
const TOKEN_DURATION = 6 * 60 * 60 * 1000; // 6 hours

// http://mongoosejs.com/docs/schematypes.html
// http://mongoosejs.com/docs/validation.html

const userSchema = new mongoose.Schema({
  username: {type: String, required: 'Username is required', unique: true},
  email: {type: String, required: 'Email is required', unique: true},
  password: {type: String, required: 'Password is required'},
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  name: String,
  country: String,
});

userSchema.path('username').validate(validate.checkStringLength(), 'Username must not be empty');
userSchema.path('email').validate(validate.isEmail, 'Invalid email');
userSchema.path('password').validate(validate.checkStringLength(6), 'Password requires at least 6 characters');
userSchema.path('name').validate(validate.checkStringLength(), 'Name must not be empty');
userSchema.path('country').validate(validate.checkStringLength(2), 'Country needs at least 2 characters');

userSchema.methods.generateToken = function (callback) {
  const date = new Date();
  if(date < this.resetPasswordExpires) return callback(new Error('Already sent a reset token to this email recently'));
  crypto.randomBytes(TOKEN_LENGTH, (err, buf) => {
    if (err) return callback(err);
    const token = buf.toString('hex');
    this.resetPasswordToken = token;
    this.resetPasswordExpires = new Date(date.getTime() + TOKEN_DURATION);
    this.save(callback);
  });
};

userSchema.methods.resetPassword = function (password, callback) {
  if (new Date() > this.resetPasswordExpires) return callback(new Error('Token expired'));
  this.password = password;
  this.resetPasswordToken = undefined;
  this.resetPasswordExpires = undefined;
  this.save(callback);
};

userSchema.methods.verifyPassword = function (password, callback) {
  bcrypt.compare(password, this.password, callback);
};

userSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next();

  bcrypt.genSalt(SALT_ROUNDS, (err, salt) => {
    if (err) return next(err);
    bcrypt.hash(this.password, salt, (err, hash) => {
      if (err) return next(err);
      this.password = hash;
      next();
    });
  });

});

userSchema.statics.validationErrorHandler = errorHandler('Username or email already in use');

const User = mongoose.model('User', userSchema);
module.exports = User;
