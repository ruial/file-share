const debug = require('debug')('file-share:file');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Trade = require('./tradeRequest');
const errorHandler = require('../lib/mongooseErrorHandler');

const fileSchema = new mongoose.Schema({
  name: {type: String, required: 'File name is required'},
  size: {type: Number, min: 0},
  uploadDate: {type: Date, default: Date.now, index: true},
  author: {type: String, required: 'Author username is required'},
  storageName: {type: String, required: 'Storage name is required'}
});

fileSchema.methods.removeFile = function (username, callback) {
  // use nextTick to make this method always behave asynchronously
  if (this.author !== username) return process.nextTick(() => callback(new Error('Wrong author')));
  this.remove(err => {
    if (err) return callback(err);
    callback(null); // when file is removed from database don't wait for the trade removals and file deletion
    debug('Removing trades and deleting file');
    Trade.remove({file: this._id}, err => {
      if (err) debug('error removing %s trades: %o', this._id, err);
    });
    fs.unlink(this.filePath(), err => {
      if (err) debug('error removing file %s: %o', this.storageName, err);
    });
  });
};

fileSchema.methods.filePath = function () {
  return path.join(__dirname, '../uploads', this.storageName);
};

fileSchema.statics.validationErrorHandler = errorHandler();

const File = mongoose.model('File', fileSchema);
module.exports = File;
