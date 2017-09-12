const debug = require('debug')('file-share:tradeController');
const TradeRequest = require('../models/tradeRequest');
const File = require('../models/file');

exports.sendRequest = function (req, res, next) {
  File.findById(req.body.file, (err, file) => {
    if (err) return res.json({error: 'Invalid file id'});
    if (!file) return res.json({error: 'File not found'});
    const tradeRequest = new TradeRequest({file: file.id, to: file.author, from: req.user.username});
    tradeRequest.save(err => {
      debug('trade request error: %o', err);
      if (err) {
        let error = 'Unknown error';
        if (err.errors) {
          error = Object.values(err.errors).map(message => {
            return message;
          }).join('. ');
        }
        else if (err.code === 11000) {
          error = 'You already sent this trade request';
        }
        return res.json({error: error});
      }
      debug('trade request saved: %o', tradeRequest);
      res.json({tradeRequest: tradeRequest});
    });
  });
};

exports.decideRequest = function (req, res, next) {
  TradeRequest.findById(req.body.id, (err, tradeRequest) => {
    if (err) return next(err);
    if (!tradeRequest) return next(new Error('Trade not found'));
    tradeRequest.decide(req.user.username, req.body.decision, err => {
      if (err) return next(err);
      req.flash('success', 'Trade was ' + req.body.decision.toLowerCase());
      res.redirect('back');
    });
  });
};

exports.cancelRequest = function (req, res, next) {
  TradeRequest.findById(req.body.id, (err, tradeRequest) => {
    if (err) return next(err);
    if (!tradeRequest) return next(new Error('Trade not found'));
    tradeRequest.cancel(req.user.username, err => {
      if (err) return next(err);
      req.flash('success', 'Trade was cancelled');
      res.redirect('back');
    });

  });
};

exports.showRequests = function (req, res, next) {
  const username = req.user.username;
  TradeRequest
    .find({from: username, $or: [{status: 'Accepted'}, {status: 'Pending'}]})
    .sort('-createDate')
    .populate('file')
    .exec((err, outgoingRequests) => {
      if (err) return next(err);
      TradeRequest
        .find({to: username, status: 'Pending'})
        .sort('-createDate')
        .populate('file')
        .exec((err, incomingRequests) => {
          if (err) return next(err);
          res.render('trades/userTrades',
            {
              title: 'My trades',
              outgoingRequests: outgoingRequests,
              incomingRequests: incomingRequests
            });
        });
    });
};
