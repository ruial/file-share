const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const exphbs = require('express-handlebars');
const hbsHelpers = require('./lib/hbsHelpers');

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
const flash = require('connect-flash');
const messages = require('./lib/expressMessages');
const auth = require('./middlewares/auth');

const index = require('./routes/index');
const users = require('./routes/users');
const trades = require('./routes/trades');

const credentials = require('./config/credentials');

const app = express();

// view engine setup
const hbs = exphbs.create({
  extname: '.hbs',
  defaultLayout: 'main',
  helpers: hbsHelpers
});
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: credentials.cookieSecret,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({mongooseConnection: mongoose.connection}) // reuse mongoose connection
}));
app.use(flash());
app.use(function (req, res, next) {
  res.locals.messages = messages(req);
  next();
});

auth.setup(app);

app.use('/', index);
app.use('/users', users);
app.use('/trades', trades);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
