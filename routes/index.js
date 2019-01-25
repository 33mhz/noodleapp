module.exports = function(app, client, isLoggedIn, noodle, config) {
  var pnut = require('../lib/pnut');
  var webremix = require('../lib/web-remix');
  var utils = require('../lib/utils');
  var userDb = require('../lib/user');
  var charLimit = 256;

  var FOLLOWING_MAX = 200;

  app.get('/', function(req, res) {
    var analytics = false;

    if (req.user) {
      // Process all the users's top 300 followed
      req.body.count = FOLLOWING_MAX;
      pnut.following(req, function(err, users) {
        if (users) {
          users.data.forEach(function(user) {
            userDb.bffUser(utils.getUser(req).id, user.username, client);
          });
        }
      });

      // pnut.blocked


      pnut.muted(req, function(err, users) {
        if (users) {
          users.data.forEach(function(user) {
            userDb.mutant(utils.getUser(req).id, user.username, client);
          });
        }
      });

      var mediaOn = '';
      var darkerTheme = '';
      var highContrast = '';

      userDb.getSettings(req, client, function(err, userItems) {
        if (err) {
          res.status(500);
          res.redirect('/500');
        } else {

          if (userItems.mediaOn === 'false') {
            mediaOn = 'media-disable';
          }

          if (userItems.highContrast === 'true') {
            highContrast = 'high-contrast';
          }

          if (userItems.darkerTheme === 'true') {
            darkerTheme = 'alex';
          }

          if (userItems.charLimit === 'true') {
            charLimit = 140;
          } else {
            charLimit = 256;
          }

          if (config.get('analytics')) {
            analytics = config.get('analytics');
          }

          req.session.url = '/my/feed';
          res.render('index', {
            pageType: 'index',
            session: utils.getUser(req),
            csrf: req.csrfToken(),
            url: '/my/feed',
            loggedInId: utils.getUserId(req),
            username: utils.getUser(req).username,
            mediaOn: mediaOn,
            darkerTheme: darkerTheme,
            highContrast: highContrast,
            charLimit: charLimit,
            loggedUsername: utils.getUser(req).username,
            analytics: analytics
          });
        }
      });
    } else {
      res.render('index', {
        pageType: 'index',
        url: '',
        session: false,
        loggedInId: '',
        username: '',
        mediaOn: '',
        darkerTheme: '',
        highContrast: '',
        charLimit: charLimit,
        loggedUsername: '',
        analytics: analytics
      });
    }
  });

  app.get('/user/:username', isLoggedIn, function(req, res) {
    var analytics = false;

    pnut.getUser(req, req.params.username, function(err, user) {
      if (err) {
        res.status(500);
        res.redirect('/500');
      } else {
        if (user.meta.code === 404) {
          res.render('404');
        } else {
          if (user.data) {
            user = user.data;
          }
          var description = '';

          // User descriptions don't always exist
          if (user.content && user.content.html) {
            description = user.content.html;
          }

          var mediaOn = '';
          var darkerTheme = '';
          var highContrast = '';

          userDb.getSettings(req, client, function(err, userItems) {
            if (err) {
              res.status(500);
              res.redirect('/500');
            } else {
              if (userItems.mediaOn === 'false') {
                mediaOn = 'media-disable';
              }
              
              if (userItems.darkerTheme === 'true') {
                darkerTheme = 'alex';
              }

              if (userItems.highContrast === 'true') {
                highContrast = 'high-contrast';
              }

              if (userItems.charLimit === 'true') {
                charLimit = 140;
              } else {
                charLimit = 256;
              }
            }

            if (config.get('analytics')) {
              analytics = config.get('analytics');
            }

            res.render('profile', {
              pageType: 'profile',
              csrf: req.csrfToken(),
              username: req.params.username,
              session: utils.getUser(req),
              user: user,
              url: req.session.url || '/my/feed',
              description: description,
              loggedInId: utils.getUserId(req),
              mediaOn: mediaOn,
              darkerTheme: darkerTheme,
              highContrast: highContrast,
              charLimit: charLimit,
              loggedUsername: utils.getUser(req).username,
              analytics: analytics
            });
          });
        }
      }
    });
  });

  var renderSettings = function(err, req, res, locals) {
    if (err) {
      res.status(500);
      res.redirect('/500');
    } else {
      locals.csrf = req.csrfToken();
      locals.layout = false;
      res.render('settings', locals);
    }
  };

  app.get('/settings', isLoggedIn, function(req, res) {
    userDb.getSettings(req, client, function(err, settings) {
      renderSettings(err, req, res, settings);
    });
  });

  app.post('/settings', isLoggedIn, function(req, res) {
    userDb.saveSettings(req, client, function(err, settings) {
      res.redirect('/');
    });
  });

  app.get('/user/posts/:id', isLoggedIn, function(req, res) {
    var userId = req.params.id || utils.getUserId(req);

    req.session.url = '/user/posts/' + parseInt(userId, 10);

    pnut.userPosts(req, client, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving your posts' });
      } else {
        utils.generateFeed(req, recentMessages, false, function(messages) {
          res.json({ messages: messages });
        });
      }
    });
  });

  app.get('/user/mentions/:id', isLoggedIn, function(req, res) {
    var userId = req.params.id || utils.getUserId(req);

    if (!req.query.ping) {
      req.session.url = '/user/mentions/' + parseInt(userId, 10);
    }

    pnut.userMentions(req, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving mentions' });
      } else {
        utils.generateFeed(req, recentMessages, false, function(messages) {
          res.json({ messages: messages });
        });
      }
    });
  });

  app.get('/user/interactions/:id', isLoggedIn, function(req, res) {
    var userId = req.params.id || utils.getUserId(req);

    req.session.url = '/user/interactions/' + parseInt(userId, 10);

    pnut.userInteractions(req, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving interactions' });
      } else {
        utils.generateInteractions(req, recentMessages, false, function(messages) {
          res.json({ messages: messages });
        });
      }
    });
  });

  app.get('/user/starred/:id', isLoggedIn, function(req, res) {
    var userId = req.params.id || utils.getUserId(req);

    req.session.url = '/user/starred/' + parseInt(userId, 10);

    pnut.userStarred(req, client, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving starred' });
      } else {
        utils.generateFeed(req, recentMessages, false, function(messages) {
          res.json({ messages: messages });
        });
      }
    });
  });

  app.get('/my/feed', isLoggedIn, function(req, res) {
    req.session.url = '/my/feed';

    pnut.myFeed(req, client, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving your personal feed' });
      } else {
        utils.generateFeed(req, recentMessages, false, function(messages) {
          res.json({ messages: messages });
        });
      }
    });
  });

  // explore stream(s)
  app.get('/global/feed', isLoggedIn, function(req, res) {
    req.session.url = '/global/feed';

    pnut.globalFeed(req, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving the global feed' });
      } else {
        utils.generateFeed(req, recentMessages, false, function(messages) {
          res.json({ messages: messages });
        });
      }
    });
  });

  app.get('/paginated/feed/:id/:post_id', isLoggedIn, function(req, res) {
    pnut.paginatedFeed(req, client, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving the paginated feed' });
      } else {
        utils.generateFeed(req, recentMessages, true, function(messages) {
          res.json({ messages: messages });
        });
      }
    });
  });

  app.get('/paginated/interactions', isLoggedIn, function(req, res) {
    pnut.paginatedFeed(req, client, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving the paginated feed' });
      } else {
        utils.generateInteractions(req, recentMessages, true, function(messages) {
          res.json({ messages: messages });
        });
      }
    });
  });

  app.post('/post', isLoggedIn, function(req, res) {
    pnut.addMessage(req, client, function(err, recentMessage) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error posting a new message' });
      } else {
        utils.generateFeed(req, [recentMessage.data], true, function(messages) {
          res.json({ messages: messages });
        });
      }
    });
  });

  app.delete('/post', isLoggedIn, function(req, res) {
    pnut.deleteMessage(req, client, function(err, message) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error deleting message' });
      } else {
        res.json({ 'message': 'deleted successfully' });
      }
    });
  });

  app.put('/star', isLoggedIn, function(req, res) {
    pnut.starMessage(req, client, function(err, message) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error starring message' });
      } else {
        res.json({ 'message': 'starred successfully' });
      }
    });
  });

  app.delete('/star', isLoggedIn, function(req, res) {
    pnut.unstarMessage(req, client, function(err, message) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error unstarring message' });
      } else {
        res.json({ 'message': 'unstarred successfully' });
      }
    });
  });

  app.put('/repost', isLoggedIn, function(req, res) {
    pnut.repost(req, client, function(err, message) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error reposting message' });
      } else {
        res.json({ 'message': 'reposted successfully' });
      }
    });
  });

  app.delete('/repost', isLoggedIn, function(req, res) {
    pnut.unrepost(req, client, function(err, message) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error reposting message' });
      } else {
        res.json({ 'message': 'unreposted successfully' });
      }
    });
  });

  app.put('/follow', isLoggedIn, function(req, res) {
    pnut.follow(req, client, function(err, user) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error following user' });
      } else {
        res.json({ 'message': 'followed successfully' });
      }
    });
  });

  app.delete('/follow', isLoggedIn, function(req, res) {
    pnut.unfollow(req, client, function(err, user) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error unfollowing user' });
      } else {
        res.json({ 'message': 'unfollowed successfully' });
      }
    });
  });

  app.put('/mute', isLoggedIn, function(req, res) {
    pnut.mute(req, client, function(err, user) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error muting user' });
      } else {
        res.json({ 'message': 'muted successfully' });
      }
    });
  });

  app.delete('/mute', isLoggedIn, function(req, res) {
    pnut.unmute(req, client, function(err, user) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error unmuting user' });
      } else {
        res.json({ 'message': 'unmuted successfully' });
      }
    });
  });

  app.get('/followers', isLoggedIn, function(req, res) {
    pnut.followers(req, function(err, users) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving followers' });
      } else {
        res.json({ users: users.data });
      }
    });
  });

  app.get('/following', isLoggedIn, function(req, res) {
    pnut.following(req, function(err, users) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving following' });
      } else {
        res.json({ users: users.data });
      }
    });
  });

  app.get('/thread', isLoggedIn, function(req, res) {
    pnut.thread(req, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving thread' });
      } else {
        utils.generateFeed(req, recentMessages, false, function(messages) {
          res.json({ messages: messages });
        });
      }
    });
  });

  app.get('/tags', isLoggedIn, function(req, res) {
    pnut.getTags(req, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving tagged posts' });
      } else {
        utils.generateFeed(req, recentMessages, false, function(messages) {
          res.json({ messages: messages });
        });
      }
    });
  });

  app.get('/post', isLoggedIn, function(req, res) {
    pnut.getPost(req, function(err, recentMessage) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving post' });
      } else {
        utils.generateFeed(req, [recentMessage], false, function(messages) {
          res.json({ messages: messages });
        });
      }
    });
  });

  app.get('/starred_users', isLoggedIn, function(req, res) {
    pnut.starredUsers(req, function(err, users) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving bookmarking users' });
      } else {
        res.json({ users: users.data });
      }
    });
  });

  app.get('/reposted_users', isLoggedIn, function(req, res) {
    pnut.repostedUsers(req, function(err, users) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving reposting users' });
      } else {
        res.json({ users: users.data });
      }
    });
  });

  // Request the current version number
  app.get('/version', function(req, res) {
    res.json({
      'version': noodle.version
    });
  });

  app.get('/my/bffs', isLoggedIn, function(req, res) {
    var userId = utils.getUser(req).id;
    userDb.bffs(userId, client, function(err, usernames) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving bffs' });
      } else {
        res.json({ usernames: usernames });
      }
    });
  });

  app.get('/my/mutants', isLoggedIn, function(req, res) {
    var userId = utils.getUser(req).id;
    userDb.mutants(userId, client, function(err, usernames) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving mutants' });
      } else {
        res.json({ usernames: usernames });
      }
    });
  });

  app.get('/messages', isLoggedIn, function(req, res) {
    var analytics = false;

    pnut.getChannels(req, function(err, channels) {
      if (err) {
        res.redirect('/500');
      } else {
        userDb.getSettings(req, client, function(err, userItems) {
          if (err) {
            res.status(500);
            res.redirect('/500');
          } else {
            var mediaOn = '';
            var darkerTheme = '';
            var highContrast = '';

            if (userItems.mediaOn === 'false') {
              mediaOn = 'media-disable';
            }

            if (userItems.darkerTheme === 'true') {
              darkerTheme = 'alex';
            }

            if (userItems.highContrast === 'true') {
              highContrast = 'high-contrast';
            }

            if (userItems.charLimit === 'true') {
              charLimit = 140;
            } else {
              charLimit = 2048;
            }
          }

          if (config.get('analytics')) {
            analytics = config.get('analytics');
          }

          res.render('messages', {
            pageType: 'messages',
            username: utils.getUser(req).username,
            csrf: req.csrfToken(),
            session: utils.getUser(req),
            url: '/channels',
            loggedInId: utils.getUserId(req),
            mediaOn: mediaOn,
            darkerTheme: darkerTheme,
            highContrast: highContrast,
            charLimit: charLimit,
            loggedUsername: utils.getUser(req).username,
            analytics: analytics,
            channels: channels.data
          });
        });
      }
    });
  });

  app.get('/channel/:id', isLoggedIn, function(req, res) {
    pnut.getMessages(req, function(err, recentMessages) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error retrieving messages' });
      } else {
        utils.generateFeed(req, recentMessages, false, function(messages) {
          messages.reverse();
          res.render('_messages', {
            layout: false,
            messages: messages
          });
        });
      }
    });
  });

  app.post('/channel', isLoggedIn, function(req, res) {
    pnut.postChannelMessage(req, function(err, recentMessage) {
      if (err) {
        res.status(500);
        res.json({ 'error': 'error posting message' });
      } else {
        utils.generateFeed(req, [recentMessage], false, function(messages) {
          res.render('_messages', {
            layout: false,
            messages: messages
          });
        });
      }
    });
  });
};

