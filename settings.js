// Module dependencies.
module.exports = function(app, configurations, express) {
  var nconf = require('nconf')
  var passport = require('passport')
  var requirejs = require('requirejs')
  var session = require('express-session')
  var RedisStore = require('connect-redis')(session)
  var bodyParser = require('body-parser')
  var methodOverride = require('method-override')
  var cookieParser = require('cookie-parser')
  var csurf = require('csurf')
//  var errorHandler = require('errorhandler')
  var morgan = require('morgan')

  var ONE_DAY = 86400000;

  nconf.argv().env().file({ file: 'local.json' });

  // Configuration
  app.set('views', __dirname + '/views');
  app.set('view engine', 'pug');
  app.set('view options', { layout: false });
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(methodOverride())
  if (!process.env.NODE_ENV) {
    app.use(morgan('combined'));
    app.use(express.static(__dirname + '/public'));
  } else {
    app.use(express.static(__dirname + '/public_build', { maxAge: ONE_DAY }));
  }
  app.use(cookieParser());
  app.use(session({
    secret: nconf.get('session_secret'),
    store: new RedisStore({ db: nconf.get('redis_db'), prefix: 'noodleapp' }),
    cookie: { maxAge: 990000000 }, // 1 week-ish
    resave: true,
    saveUninitialized: true
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(csurf());
/*  app.use(function(req, res, next) {
    res.status(404);
    res.render('404', { url: req.url, layout: false });
    return;
  });
  app.use(function(req, res, next) {
    res.status(403);
    res.render('403', { url: req.url, layout: false });
    return;
  });*/
  app.use(function(err, req, res, next) {
    var status = err.status || 500;
    console.error('Uncaught error.  Returning ' + status + ': ', err);
    res.status(status);
    res.render('500', { error: err, layout: false });
  });

  if (app.get('env') === 'development' || app.get('env') === 'test') {
    app.use(express.static(__dirname + '/public'));
//    app.use(errorHandler({ dumpExceptions: true, showStack: true }));
  }

  if (app.get('env') === 'development') {
    app.set('redisnoodleapp', nconf.get('redis_dev'));
  } else if (app.get('env') === 'test') {
    app.set('redisnoodleapp', nconf.get('redis_test'));
  } else if (app.get('env') === 'prod') {
//    app.use(errorHandler());
    app.set('redisnoodleapp', nconf.get('redis_prod'));

    requirejs.optimize({
      appDir: 'public/',
      baseUrl: 'javascripts/',
      enforceDefine: true,
      dir: "public_build",
      modules: [
        {
          name: 'main'
        }
      ]
    }, function() {
      console.log('Successfully optimized javascript');
    });
  }

  return app;
};
