'use strict';

module.exports = function(app) {
  var appnet = require('../lib/appnet');
  var webremix = require('../lib/web-remix');
  var utils = require('../lib/utils');

  app.get('/', function(req, res) {
    res.render('index', {
      pageType: 'index',
      user: req.session.passport.user,
      csrf: req.session._csrf,
      url: req.session.url || '/my/feed'
    });
  });

  app.get('/user/posts', function(req, res) {
    var newMessages = [];
    var userId = req.params.id || req.session.passport.user.id;

    req.session.url = '/user/posts/?id=' + parseInt(userId, 10);

    appnet.userPosts(req, function(err, recentMessages) {
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

  app.get('/my/mentions', function(req, res) {
    var newMessages = [];

    req.session.url = '/my/mentions';

    appnet.myMentions(req, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving your mentions' });
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

    req.session.url = '/my/feed';

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
        utils.generateFeed([message], function(messages) {
          res.json({
            messages: messages
          })
        });
      }
    });
  });
};
