'use strict';

var utils = require('./utils');
var appnet = require('./appnet');
var markdownToEntities = require('./markdown-to-entities');
var xtend = require('xtend');
var languages = require('./languages');

var toggleSettings = [{
  name: 'directedFeed',
  description: 'Include posts directed to users I don\'t follow'
}, {
  name: 'mediaOn',
  description: 'Auto-embed media'
}, {
  name: 'charLimit',
  description: 'Limit to 140 characters'
}, {
  name: 'highContrast',
  description: 'Set high contrast interface'
}];

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
      appnet.getUser(req, user.username, function(err, user) {
        if(err) {
          callback(err);
        }
        else {
          user = user.data;
          userItems.username = user.username;
          userItems.name = user.name;
          userItems.locale = user.locale;
          userItems.timezone = user.timezone;
          userItems.description = markdownToEntities.stringify(user.description);
          userItems.languages = languages;
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
  for(var i = 0; i < toggleSettings.length; i++) {
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
        description: markdownToEntities.parse(settings.description)
      };
      appnet.putUser(req, user.username, userInfo, function(err, resp) {
        if (err) {
          callback(err);
        } else {
          self.getSettings(req, client, callback);
        }
      });
    }
  });
};
