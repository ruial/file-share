const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  _id: String,
  session: String,
  expires: Date
}, {strict: false});

/**
 * Clears all sessions associated with a userId
 * When userSessionId is defined, it means the user is updating the password, so do not clear his session
 * otherwise the user is not logged in and wants to reset the password, so clear all related sessions
 * @param userId {String}
 * @param userSessionId {String}
 * @param callback {Function}
 */
sessionSchema.statics.clearSessions = function (userId, userSessionId, callback) {
  const filter = {session: {$regex: `.*"user":"${userId}".*`}};
  if (userSessionId) filter.id = {$ne: userSessionId};
  this.remove(filter, callback);
};

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;
