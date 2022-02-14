'use strict';

var utils = require('./utils');
var pnut = require('./pnut');
// var markdownToEntities = require('./markdown-to-entities');
var xtend = require('xtend');
var languages = require('./languages');
var timezones = require('./timezones');

var toggleSettings = [
  {
    name: 'directedFeed',
    description: 'Include posts directed to users I don\'t follow'
  },
  {
    name: 'unifiedFeed',
    description: 'Include mentions in feed' // alpha: Show mentions in Your Stream
  },
  {
    name: 'mediaOn',
    description: 'Auto-embed media'
  },
  {
    name: 'charLimit',
    description: 'Limit to 140 characters'
  },
  {
    name: 'highContrast',
    description: 'Set high contrast interface'
  },
  {
    name: 'darkerTheme',
    description: 'Set Alex-mode interface'
  }
];

exports.bffUser = function(userId, username, client) {
  client.sadd('userBFFs:' +  userId, username);
};

exports.unbffUser = function(userId, username, client) {
  client.srem('userBFFs:' +  userId, username);
};

exports.bffs = function(userId, client, callback) {
  client.smembers('userBFFs:' +  userId, callback);
  client.expire('userBFFs:' +  userId, 60 * 60 * 24 * 3); // 3 days
};

exports.mutant = function(userId, username, client) {
  client.sadd('mutes:' +  userId, username);
};

exports.mutants = function(userId, client, callback) {
  client.smembers('mutes:' +  userId, callback);
  client.expire('mutes:' +  userId, 60 * 60 * 24 * 30); // 30 days
};

exports.getLocalSettings = function(req, client, callback) {
  var user = utils.getUser(req);
  var userId = user.id;

  client.hgetall('settings:' + userId, function(err, userItems) {
    if (err) {
      callback(err);
    } else {
      userItems = xtend({
        directedFeed: 'false',
        mediaOn: 'true',
        charLimit: 'false',
        darkerTheme: 'false',
        highContrast: 'false'
      }, userItems || {});
      callback(null, userItems);
    }
  });
}

exports.getSettings = function(req, client, callback) {
  var user = utils.getUser(req);
  var userId = user.id;

  this.getLocalSettings(req, client, function(err, userItems) {
    if (err) {
      callback(err);
    } else {
      pnut.getUser(req, user.username, function(err, user) {
        if(err) {
          callback(err);
        } else {
          user = user.data;
          userItems.username = user.username;
          if (typeof user.name !== 'undefined') {
            userItems.name = user.name;
          } else {
            userItems.name = '';
          }

          // If these aren't set, they return as null
          if (user.locale) {
            userItems.locale = user.locale;
          } else {
            userItems.locale = '';
          }
          if (user.timezone) {
            userItems.timezone = user.timezone;
          } else {
            userItems.timezone = '';
          }
          if (user.content) {
            try {
              userItems.content = user.content.markdown_text;
            } catch(e) {
              userItems.content = user.content;
            }
          } else {
              userItems.content = '';
          }
          userItems.languages = languages;
          userItems.timezones = timezones;
          userItems.toggleSettings = toggleSettings;

          callback(null, userItems);
        }
      });
    }
  });
};

exports.saveSettings = function(req, client, callback) {
  var self = this;
  var user = utils.getUser(req);

  var settings = req.body.user;
  var localSettings = {};
  // All the local settings are currently toggle, but that might not stay true.
  for (var i = 0; i < toggleSettings.length; i ++) {
    localSettings[toggleSettings[i].name] = settings[toggleSettings[i].name];
  }

  client.hmset('settings:' + user.id, localSettings, function(err, resp) {
    if (err) {
      callback(err);
    } else {
      var userInfo = {
        name: settings.name,
        locale: settings.locale,
        timezone: settings.timezone,
        content: {text:settings.content}
      };
      pnut.putUser(req, user.username, userInfo, function(err, resp) {
        if (err) {
          callback(err);
        } else {
          self.getSettings(req, client, callback);
        }
      });
    }
  });
};
