const debug = require('debug')('file-share:userController');
const User = require('../models/user');
const UserSession = require('../models/userSession');
const email = require('../lib/email');

const REMEMBER_ME_DURATION = 14 * 24 * 60 * 60 * 1000; // 2 weeks, same as connect-mongo default

exports.register = {
  get: function (req, res) {
    res.render('users/register', {title: 'Register'});
  },

  post: function (req, res, next) {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const user = new User({username: username, email: email, password: password});
    user.save(err => {
      if (err) return User.validationErrorHandler(err, req, res, next);
      debug('user saved: %o', user);
      req.login(user, err => {
        if (err) return next(err);
        req.flash('success', 'You are now registered');
        res.redirect('/');
      });
    });
  }
};

exports.login = function (req, res) {
  res.render('users/login', {title: 'Login', redirect: req.query.next || '/'});
};

exports.loginSuccess = function (req, res, next) {
  if (req.body.remember) {
    req.session.cookie.maxAge = REMEMBER_ME_DURATION;
  }
  else {
    req.session.cookie.expires = false;
  }
  const userSession = new UserSession({userId: req.user.id, sessionId: req.sessionID});
  userSession.save(err => {
    if (err) return next(err);
    req.flash('info', 'You are now logged in, ' + req.user.username);
    res.redirect(req.body.redirect || '/');
  });
};

exports.logout = function (req, res) {
  req.logout();
  req.flash('info', 'You are logged out');
  res.redirect('/');
};

exports.changePassword = {
  get: function (req, res) {
    res.render('users/updatePassword', {title: 'Change password'});
  },

  post: function (req, res, next) {
    const user = req.user;
    user.password = req.body.password;
    user.save(err => {
      if (err) return User.validationErrorHandler(err, req, res, next);
      UserSession.clear(user.id, req.sessionID, err => {
        if (err) debug('Error clearing sessions: %o', err);
        req.flash('success', 'Password changed with success');
        res.redirect('/');
      });
    });
  }
};

exports.passwordResetRequest = {
  get: function (req, res) {
    res.render('users/resetPassword', {title: 'Reset password'});
  },

  post: function (req, res, next) {
    User.findOne({email: req.body.email}, (err, user) => {
      if (err) return next(err);
      if (!user) {
        req.flash('warning', 'Email not found');
        return res.redirect('back');
      }
      user.generateToken(err => {
        if (err) return User.validationErrorHandler(err, req, res, next);
        req.flash('info', 'Sending an email with instructions to recover your account');
        res.redirect('/');
        email.sendPasswordResetEmail(user);
      });
    });
  }
};

exports.passwordReset = {

  get: function (req, res) {
    res.render('users/updatePassword', {title: 'Reset password'});
  },

  post: function (req, res, next) {
    const token = req.params.token;
    const password = req.body.password;
    User.findOne({resetPasswordToken: token}, (err, user) => {
      if (err) return next(err);
      if (!user) return next(new Error('Token not found'));
      user.resetPassword(password, err => {
        if (err) return User.validationErrorHandler(err, req, res, next);
        UserSession.clear(user.id, null, err => {
          if (err) return next(err);
          req.flash('success', 'Password changed, try to login');
          res.redirect('/users/login');
        });
      });
    });
  }
};

exports.updateProfile = {
  get: function (req, res) {
    res.render('users/updateProfile', {title: 'Update profile'});
  },

  post: function (req, res, next) {
    // only set these optional fields if they exist to prevent validation errors when they are not filled
    if (req.body.name) req.user.name = req.body.name;
    if (req.body.country) req.user.country = req.body.country;
    req.user.email = req.body.email;
    req.user.save(err => {
      if (err) return User.validationErrorHandler(err, req, res, next);
      req.flash('success', 'Profile updated');
      res.redirect('back');
    });
  }
};
