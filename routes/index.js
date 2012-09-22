'use strict';

module.exports = function(app) {
  var appnet = require('../lib/appnet');
  var webremix = require('../lib/web-remix');

  app.get('/', function(req, res) {
    res.render('index', {
      pageType: 'index',
      user: req.session.passport.user
    });
  });

  app.get('/my/posts', function(req, res) {
    var newMessages = [];

    appnet.myPosts(req, function(err, recentMessages) {
      recentMessages.forEach(function(recent, counter) {
        if (err) {
          res.status(500);
          res.json({ 'message': 'error retrieving your posts' });

        } else {
          if (recent.text) {
            var messageData = {};
            webremix.generate(recent.text, function(errMsg, message) {
              if (!errMsg) {
                messageData.created_at = recent.created_at;
                messageData.message = message;
                newMessages.push(messageData);
              }
            });
          }

          if (counter === recentMessages.length - 1) {
            res.json({
              messages: newMessages
            });
          }
        }
      });
    });
  });

  app.get('/my/feed', function(req, res) {
    var newMessages = [];

    appnet.myFeed(req, function(err, recentMessages) {
      console.log(recentMessages)
      recentMessages.forEach(function(recent, counter) {
        if (err) {
          res.status(500);
          res.json({ 'message': 'error retrieving feed posts' });

        } else {
          if (recent.text) {
            var messageData = {};
            webremix.generate(recent.text, function(errMsg, message) {
              if (!errMsg) {
                messageData.created_at = recent.created_at;
                messageData.message = message;
                newMessages.push(messageData);
              }
            });
          }

          if (counter === recentMessages.length - 1) {
            res.json({
              messages: newMessages
            });
          }
        }
      });
    });
  });

  app.get('/global/feed', function(req, res) {
    var newMessages = [];

    appnet.globalFeed(function(err, recentMessages) {
      recentMessages.forEach(function(recent, counter) {
        if (err) {
          res.status(500);
          res.json({ 'message': 'error retrieving global posts' });

        } else {
          if (recent.text) {
            var messageData = {};
            webremix.generate(recent.text, function(errMsg, message) {
              if (!errMsg) {
                messageData.created_at = recent.created_at;
                messageData.message = message;
                newMessages.push(messageData);
              }
            });
          }

          if (counter === recentMessages.length - 1) {
            res.json({
              messages: newMessages
            });
          }
        }
      });
    });
  });
};
