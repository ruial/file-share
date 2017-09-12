const debug = require('debug')('file-share:email');

exports.sendPasswordResetEmail = function (user) {
  // TODO send email
  debug('Password reset -> email: %s, username: %s, token: %s', user.email, user.username, user.resetPasswordToken);
};
