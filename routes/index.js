'use strict';

module.exports = function(app) {
  var appnet = require('../lib/appnet');
  var webremix = require('../lib/web-remix');
  var utils = require('../lib/utils');

  app.get('/', function(req, res) {
    // If we've been browsing another user and we come back to the index
    // page, just reset it to your personal feed
    if (req.session.url.match(/\/user\/posts/)) {
      req.session.url = '/my/feed';
    }

    res.render('index', {
      pageType: 'index',
      session: req.session.passport.user,
      csrf: req.session._csrf,
      url: req.session.url || '/my/feed'
    });
  });

  app.get('/user/:username', function(req, res) {
    appnet.getUser(req, function(err, user) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'could not retrieve user' });
      } else {
        req.session.url = '/user/posts?id=' + user.id;

        res.render('profile', {
          pageType: 'profile',
          csrf: req.session._csrf,
          username: req.params.username,
          session: req.session.passport.user,
          user: user,
          url: req.session.url || '/my/feed'
        });
      }
    });
  });

  app.get('/user/posts/:id', function(req, res) {
    var newMessages = [];
    var userId = req.params.id || req.session.passport.user.id;

    req.session.url = '/user/posts/' + parseInt(userId, 10);

    appnet.userPosts(req, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving your posts' });
      } else {
        utils.generateFeed(recentMessages, function(messages) {
          res.json({
            messages: messages
          });
        });
      }
    });
  });

  app.get('/user/mentions/:id', function(req, res) {
    var newMessages = [];
    var userId = req.params.id || req.session.passport.user.id;

    req.session.url = '/user/mentions/' + parseInt(userId, 10);

    appnet.userMentions(req, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving mentions' });
      } else {
        utils.generateFeed(recentMessages, function(messages) {
          res.json({
            messages: messages
          });
        });
      }
    });
  });

  app.get('/user/starred/:id', function(req, res) {
    var newMessages = [];
    var userId = req.params.id || req.session.passport.user.id;

    req.session.url = '/user/starred/' + parseInt(userId, 10);

    appnet.userStarred(req, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving starred' });
      } else {
        utils.generateFeed(recentMessages, function(messages) {
          res.json({
            messages: messages
          });
        });
      }
    });
  });

  app.get('/my/feed', function(req, res) {
    var newMessages = [];

    req.session.url = '/my/feed';

    appnet.myFeed(req, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving your personal feed' });
      } else {
        utils.generateFeed(recentMessages, function(messages) {
          res.json({
            messages: messages
          });
        });
      }
    });
  });

  app.get('/global/feed', function(req, res) {
    req.session.url = '/global/feed';

    appnet.globalFeed(req, function(err, recentMessages) {
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
        res.json({
          'message': 'posted successfully'
        });
      }
    });
  });
};
