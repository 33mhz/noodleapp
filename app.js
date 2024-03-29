var express = require('express')
var configurations = module.exports
var app = express()
var nconf = require('nconf')
var settings = require('./settings')(app, configurations, express)
var passport = require('passport')
var redis = require('redis')
var client = redis.createClient()
// client.connect().catch(console.error)
var PnutStrategy = require('passport-pnut').Strategy
var noodle = require('./package')
var utils = require('./lib/utils')
var userDb = require('./lib/user')
var errorHandler = require('errorhandler')

nconf.argv().env().file({ file: 'local.json' })

console.log(`NODE_ENV=${app.get('env')}`)

/* Passport OAuth setup */

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new PnutStrategy({
    clientID: nconf.get('pnut_consumer_key'),
    clientSecret: nconf.get('pnut_consumer_secret'),
    scope: 'stream messages:io.pnut.core.chat,messages:io.pnut.core.pm,write_post,follow,update_profile',
    callbackURL: nconf.get('domain') + '/auth/pnut/callback'
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
  if (req.user) {
    next();
  } else {
    res.redirect('/');
  }
};

/* Routing setup */

require('./routes')(app, client, isLoggedIn, noodle, nconf)
require('./routes/auth')(app, passport)

app.get('/404', function(req, res, next) {
  next();
});

app.get('/403', function(req, res, next) {
  res.status(403);
  next(new Error('not allowed!'));
});

app.get('/500', function(req, res, next) {
  next(new Error('something went wrong!'));
});

if (app.get('env') === 'prod') {
  app.use(errorHandler())
} else {
  app.use(errorHandler({ dumpExceptions: true, showStack: true }))
}

app.listen(process.env.PORT || nconf.get('port'));
