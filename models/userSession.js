const mongoose = require('mongoose');

// Collection created by connect-mongo
const sessionSchema = new mongoose.Schema({
  _id: String, // session id
  session: String, // session content
  expires: Date
}, {strict: false});

const Session = mongoose.model('Session', sessionSchema);


// Collection to help with session invalidation, more efficient than regex search for the userId on the session content
// To prevent this collection from growing too much, old docs should be removed from time to time
const userSessionSchema = new mongoose.Schema({
  userId: {type: String, index: true},
  sessionId: String,
  loginDate: {type: Date, default: Date.now}
}, {versionKey: false});

/**
 * Clears all sessions associated with a userId
 * When userSessionId is defined, it means the user is updating the password, so do not clear his session
 * otherwise the user is not logged in and wants to reset the password, so clear all related sessions
 * @param userId {String}
 * @param userSessionId {String}
 * @param callback {Function}
 */
userSessionSchema.statics.clear = function (userId, userSessionId, callback) {
  const filter = {userId: userId};
  if (userSessionId) filter.sessionId = {$ne: userSessionId};
  // get session ids (as an array of unique values) from the user and remove them from the other collection
  this.find(filter).distinct('sessionId', (err, results) => {
    if (err) return callback(err);
    Session.remove({_id: {$in: results}}, callback);
  });
};

userSessionSchema.statics.clearAll = function () {
  return Promise.all([Session.remove(), this.remove()]);
};

const UserSession = mongoose.model('UserSession', userSessionSchema);
module.exports = UserSession;
