'use strict';

module.exports = function(app) {
  var appnet = require('../lib/appnet');
  var webremix = require('../lib/web-remix');

  app.get('/', function (req, res) {
    // console.log(req.session.passport.user)
    var message = {};

    if (req.session.passport.user) {
      appnet.myPosts(req, function(err, recentMessages) {
        if (err) {
          console.log('(( ', err)
          res.status(500);
          res.redirect('/500');
        } else {
          var newMessages = [];

          recentMessages.forEach(function(recent) {
            if (recent.text) {
              webremix.generate(recent.text, function(errMsg, message) {
                if (!errMsg) {
                  newMessages.push(message);
                }
              });
            }
          });

          res.render('index', {
            pageType: 'index',
            user: req.session.passport.user,
            messages: newMessages
          });
        }
      });
    } else {
      res.render('index', {
        pageType: 'index',
        user: req.session.passport.user
      });
    }
  });
};
