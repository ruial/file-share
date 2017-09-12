module.exports = function (duplicateMessage) {
  return function (err, req, res, next) {
    if (err.name === 'ValidationError') { // validation errors
      for (let error of Object.values(err.errors)) {
        req.flash('error', error.message);
      }
    }
    else if (err.code === 11000) { // duplicate error
      req.flash('error', duplicateMessage);
    }
    else {
      req.flash('error', err.message); // other errors
    }
    res.redirect('back');
  };
};
