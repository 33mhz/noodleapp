'use strict';

var express = require('express');
var configurations = module.exports;
var app = express();
var server = require('http').createServer(app);
var nconf = require('nconf');
var settings = require('./settings')(app, configurations, express);
var passport = require('passport');
var redis = require('redis');
var client = redis.createClient();
var AppDotNetStrategy = require('passport-appdotnet').Strategy;
var noodle = require('./package');
var utils = require('./lib/utils');
var userDb = require('./lib/user');

nconf.argv().env().file({ file: 'local.json' });

/* Passport OAuth setup */

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new AppDotNetStrategy({
    clientID: nconf.get('appnet_consumer_key'),
    clientSecret: nconf.get('appnet_consumer_secret'),
    scope: 'stream messages write_post follow update_profile',
    callbackURL: nconf.get('domain') + ':' + nconf.get('authPort') + '/auth/appdotnet/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function (err) {
      if (!profile.access_token) {
        profile.access_token = accessToken;
      }
      return done(err, profile);
    });
  }
));

/* Filters for routes */

var isLoggedIn = function(req, res, next) {
  if (req.session.passport.user) {
    next();
  } else {
    res.redirect('/');
  }
};

/* Routing setup */

require('./routes')(app, client, isLoggedIn, noodle, nconf);
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

server.listen(process.env.PORT || nconf.get('port'));
