const debug = require('debug')('file-share:fileController');
const File = require('../models/file');
const paginate = require('../lib/mongoosePaginate');

exports.upload = function (req, res, next) {
  const file = new File({
    name: req.file.originalname,
    storageName: req.file.filename,
    size: req.file.size,
    author: req.user.username
  });

  file.save(err => {
    if (err) return File.validationErrorHandler(err, req, res, next);
    debug('file saved: %o', file);
    req.flash('success', 'File uploaded with success');
    res.redirect('/files');
  });
};

exports.userFiles = function (req, res, next) {
  File.find({author: req.user.username}).sort('-uploadDate').exec((err, files) => {
    if (err) return next(err);
    res.render('files/userFiles', {title: 'Your files', files: files});
  });
};

exports.allFiles = function (req, res, next) {
  const page = Number(req.query.page) || 1;
  const query = File.find().sort('-uploadDate');
  paginate(query, 5, page, (err, result) => {
    if (err) return next(err);
    res.render('files/allFiles', {title: 'File share', pagination: result});
  });
};

exports.remove = function (req, res, next) {
  File.findOne({_id: req.body.id, author: req.user.username}, (err, file) => {
    if (err) return next(err);
    if (!file){
      const error = new Error('File not found');
      error.status = 404;
      return next(error);
    }
    file.removeFile(err => {
      if (err) return next(err);
      req.flash('success', 'File removed');
      res.redirect('back');
    });
  });
};

exports.download = function (req, res, next) {
  File.findOne({storageName: req.params.storageName}, (err, file) => {
    if (err) return next(err);
    if (!file) return next();
    const filePath = file.filePath();
    debug('file path: ' + filePath);
    res.download(filePath, file.name);
  });
};
