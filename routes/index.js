'use strict';

module.exports = function(app) {
  var appnet = require('../lib/appnet');
  var webremix = require('../lib/web-remix');
  var utils = require('../lib/utils');

  app.get('/', function(req, res) {
    res.render('index', {
      pageType: 'index',
      user: req.session.passport.user,
      csrf: req.session._csrf
    });
  });

  app.get('/my/posts', function(req, res) {
    var newMessages = [];

    appnet.myPosts(req, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving your posts' });
      } else {
        utils.generateFeed(recentMessages, function(messages) {
          res.json({
            messages: messages
          })
        });
      }
    });
  });

  app.get('/my/feed', function(req, res) {
    var newMessages = [];

    appnet.myFeed(req, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving your personal feed' });
      } else {
        utils.generateFeed(recentMessages, function(messages) {
          res.json({
            messages: messages
          })
        });
      }
    });
  });

  app.get('/global/feed', function(req, res) {
    appnet.globalFeed(function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving the global feed' });
      } else {
        utils.generateFeed(recentMessages, function(messages) {
          res.json({
            messages: messages
          })
        });
      }
    });
  });

  app.post('/add', function(req, res) {
    appnet.addMessage(req, function(err, message) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error posting a new message' });
      } else {
        utils.generateFeed([message], function(messages) {
          res.json({
            messages: messages
          })
        });
      }
    });
  });
};
