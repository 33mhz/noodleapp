'use strict';

module.exports = function(app, client) {
  var appnet = require('../lib/appnet');
  var webremix = require('../lib/web-remix');
  var utils = require('../lib/utils');

  app.get('/', function(req, res) {
    if (req.session.passport.user) {
      // If we've been browsing another user and we come back to the index
      // page, just reset it to your personal feed
      if (req.session.url && req.session.url.match(/\/user\/posts/)) {
        req.session.url = '/my/feed';
      }

      res.render('index', {
        pageType: 'index',
        session: req.session.passport.user,
        csrf: req.session._csrf,
        url: req.session.url || '/my/feed'
      });
    } else {
      res.render('index', {
        pageType: 'index',
        url: '',
        session: false
      });
    }
  });

  app.get('/user/:username', function(req, res) {
    appnet.getUser(req, function(err, user) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'could not retrieve user' });
      } else {
        req.session.url = '/user/posts/' + user.id;
        var description = '';

        // User descriptions don't always exist
        if (user.description) {
          description = user.description.html;
        }

        res.render('profile', {
          pageType: 'profile',
          csrf: req.session._csrf,
          username: req.params.username,
          session: req.session.passport.user,
          user: user,
          url: req.session.url || '/my/feed',
          description: description
        });
      }
    });
  });

  app.get('/user/posts/:id', function(req, res) {
    var newMessages = [];
    var userId = req.params.id || req.session.passport.user.id;

    req.session.url = '/user/posts/' + parseInt(userId, 10);

    appnet.userPosts(req, client, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving your posts' });
      } else {
        utils.generateFeed(recentMessages, req.session.passport.user.id, client, function(messages) {
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
        utils.generateFeed(recentMessages, req.session.passport.user.id, client, function(messages) {
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

    appnet.userStarred(req, client, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving starred' });
      } else {
        utils.generateFeed(recentMessages, req.session.passport.user.id, client, function(messages) {
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
        utils.generateFeed(recentMessages, req.session.passport.user.id, client, function(messages) {
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
        utils.generateFeed(recentMessages, req.session.passport.user.id, client, function(messages) {
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

  app.post('/star', function(req, res) {
    appnet.starMessage(req, client, function(err, message) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error starring message' });
      } else {
        res.json({
          'message': 'starred successfully'
        });
      }
    });
  });

  app.delete('/star', function(req, res) {
    appnet.unstarMessage(req, client, function(err, message) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error unstarring message' });
      } else {
        res.json({
          'message': 'unstarred successfully'
        });
      }
    });
  });

  app.post('/repost', function(req, res) {
    appnet.repost(req, client, function(err, message) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error reposting message' });
      } else {
        res.json({
          'message': 'reposted successfully'
        });
      }
    });
  });

  app.delete('/repost', function(req, res) {
    appnet.unrepost(req, client, function(err, message) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error reposting message' });
      } else {
        res.json({
          'message': 'unreposted successfully'
        });
      }
    });
  });

  app.post('/follow', function(req, res) {
    appnet.follow(req, function(err, user) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error following user' });
      } else {
        res.json({
          'message': 'followed successfully'
        });
      }
    });
  });

  app.delete('/follow', function(req, res) {
    appnet.unfollow(req, function(err, user) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error unfollowing user' });
      } else {
        res.json({
          'message': 'unfollowed successfully'
        });
      }
    });
  });

  app.post('/mute', function(req, res) {
    appnet.mute(req, function(err, user) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error muting user' });
      } else {
        res.json({
          'message': 'muted successfully'
        });
      }
    });
  });

  app.delete('/mute', function(req, res) {
    console.log('got here')
    appnet.unmute(req, function(err, user) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error unmuting user' });
      } else {
        res.json({
          'message': 'unmuted successfully'
        });
      }
    });
  });
};
