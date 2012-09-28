'use strict';

// Module dependencies.
module.exports = function(app, configurations, express) {
  var RedisStore = require('connect-redis')(express);
  var nconf = require('nconf');
  var passport = require('passport');

  nconf.argv().env().file({ file: 'local.json' });

  // Configuration

  app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', { layout: false });
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public'));
    if (!process.env.NODE_ENV) {
      app.use(express.logger('dev'));
    }
    app.use(express.cookieParser());
    app.use(express.session({
      secret: nconf.get('session_secret'),
      store: new RedisStore({ db: nconf.get('redis_db'), prefix: 'noodleapp' }),
      cookie: { maxAge: 990000000 } // 1 week-ish
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.csrf());
    app.use(app.router);
    app.use(function(req, res, next) {
      res.status(404);
      res.render('404', { url: req.url, layout: false });
      return;
    });
    app.use(function(req, res, next) {
      res.status(403);
      res.render('403', { url: req.url, layout: false });
      return;
    });
    app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('500', { error: err, layout: false });
    });
  });

  app.configure('development, test', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  app.configure('development', function() {
    app.set('redisnoodleapp', nconf.get('redis_dev'));
  });

  app.configure('test', function() {
    app.set('redisnoodleapp', nconf.get('redis_test'));
  });

  app.configure('production', function(){
    app.use(express.errorHandler());
    app.set('redisnoodleapp', nconf.get('redis_prod'));
  });

  return app;
};
