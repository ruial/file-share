const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');

const INVALID_LOGIN_MESSAGE = 'Invalid username/password combination';

exports.setup = function (app) {

  app.use(passport.initialize());
  app.use(passport.session());

  app.get('*', (req, res, next) => {
    res.locals.user = req.user;
    next();
  });

  passport.use(new LocalStrategy(
    (username, password, done) => {
      User.findOne({username: username.trim()}, (err, user) => {
        if (err) return done(err);
        if (!user) return done(null, false, {message: INVALID_LOGIN_MESSAGE});
        user.verifyPassword(password, (err, isMatch) => {
          if (err) return done(err);
          if (!isMatch) return done(null, false, {message: INVALID_LOGIN_MESSAGE});
          return done(null, user);
        });
      });
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });

};

exports.isLoggedIn = function (req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect(`/users/login?next=${req.originalUrl}`);
};
