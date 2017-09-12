const mongoose = require('mongoose');
const credentials = require('./config/credentials');

mongoose.Promise = Promise;

const options = {
  useMongoClient: true,
  socketTimeoutMS: 0,
  keepAlive: true,
  reconnectTries: 30
};

exports.connect = function (callback) {

  mongoose.connection.on('connected', callback);
  mongoose.connection.on('error', err => {
    console.error(err.message);
    process.exit(1);
  });

  const env = process.env.NODE_ENV || 'development';
  switch (env) {
    case 'development':
      mongoose.connect(credentials.mongo.development, options);
      break;
    case 'production':
      mongoose.connect(credentials.mongo.production, options);
      break;
    case 'test':
    case 'testing':
      mongoose.connect(credentials.mongo.test, options);
      break;
    default:
      throw new Error(`Unknown execution environment: ${env}`);
  }

};

exports.disconnect = function (callback) {
  mongoose.disconnect(callback);
};
