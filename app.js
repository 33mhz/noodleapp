'use strict';

var express = require('express');
var configurations = module.exports;
var app = express();
var nconf = require('nconf');
var settings = require('./settings')(app, configurations, express);
var passport = require('passport');
var AppDotNetStrategy = require('passport-appdotnet').Strategy;

nconf.argv().env().file({ file: 'local.json' });

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new AppDotNetStrategy({
    clientID: nconf.get('appnet_consumer_key'),
    clientSecret: nconf.get('appnet_consumer_secret'),
    callbackURL: nconf.get('domain') + ':' + nconf.get('authPort') + '/auth/appdotnet/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function (err) {
      return done(err, profile);
    });
  }
));

// routes
require('./routes')(app);
require('./routes/auth')(app, passport);

app.get('/404', function(req, res, next){
  next();
});

app.get('/403', function(req, res, next){
  err.status = 403;
  next(new Error('not allowed!'));
});

app.get('/500', function(req, res, next){
  next(new Error('something went wrong!'));
});

app.listen(process.env.PORT || nconf.get('port'));
