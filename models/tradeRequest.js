const mongoose = require('mongoose');
const errorHandler = require('../lib/mongooseErrorHandler');

const tradeRequestSchema = new mongoose.Schema({
  file: {type: mongoose.Schema.Types.ObjectId, ref: 'File'},
  from: {type: String, required: 'From username is required'},
  to: {type: String, required: 'To username is required'},
  createDate: {type: Date, default: Date.now},
  status: {type: String, enum: ['Pending', 'Canceled', 'Accepted', 'Rejected'], default: 'Pending'}
});

tradeRequestSchema.path('from').validate(function (from) {
  return from !== this.to;
}, 'Cannot send trade request to myself');

tradeRequestSchema.methods.cancel = function (username, callback) {
  if (this.from !== username) return callback(new Error('This user cannot cancel this trade'));
  if (this.status !== 'Pending') return callback(new Error('It\'s only possible to cancel pending requests'));
  this.status = 'Canceled';
  this.save(callback);
};

tradeRequestSchema.methods.decide = function (username, decision, callback) {
  if (this.to !== username) return callback(new Error('This user cannot decide this trade'));
  if (this.status !== 'Pending') return callback(new Error('It\'s only possible to decide pending requests'));
  if (!(decision === 'Accepted' || decision === 'Rejected')) return callback(new Error('Invalid decision'));
  this.status = decision;
  this.save(callback);
};

tradeRequestSchema.index({file: 1, from: 1, to: 1}, {unique: true});

tradeRequestSchema.statics.validationErrorHandler = errorHandler('Cannot send repeated trade request');

const TradeRequest = mongoose.model('TradeRequest', tradeRequestSchema);
module.exports = TradeRequest;
