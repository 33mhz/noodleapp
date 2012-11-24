'use strict';

var utils = require('./utils');

exports.bffUser = function(userId, username, client) {
  client.sadd('userBFFs:' +  userId, username);
};

exports.unbffUser = function(userId, username, client) {
  client.srem('userBFFs:' +  userId, username);
};

exports.bffs = function(userId, client, callback) {
  client.smembers('userBFFs:' +  userId, callback);
  client.expire('userBFFs:' +  userId, 60 * 60 * 24 * 3) // 3 days
};

exports.getSettings = function(req, client, callback) {
  var userId = utils.getUserId(req);

  client.hgetall('settings:' + userId, function(err, userItems) {
    if (err) {
      callback(err);
    } else {
      if (!userItems) {
        // Nothing has been set for the user yet, so make a new default
        userItems = {
          directedFeed: 'false',
          mediaOn: 'true'
        };
      }
      callback(null, userItems);
    }
  });
};

exports.saveSettings = function(req, client, callback) {
  var self = this;
  var userId = utils.getUserId(req);
  var directedFeed = false;
  var mediaOn = false;
  var charLimit = false;
  var highContrast = false;

  if (req.body.directed_feed === 'true') {
    directedFeed = true;
  }

  if (req.body.media_on === 'true') {
    mediaOn = true;
  }

  if (req.body.char_limit === 'true') {
    charLimit = true;
  }

  if (req.body.high_contrast === 'true') {
    highContrast = true;
  }

  var settings = {
    directedFeed: directedFeed.toString(),
    mediaOn: mediaOn.toString(),
    charLimit: charLimit.toString(),
    highContrast: highContrast.toString()
  };

  client.hmset('settings:' + userId, settings, function(err, resp) {
    if (err) {
        console.log('got here', err)
      callback(err);
    } else {
      self.getSettings(req, client, function(err, userItems) {
        if (err) {
          callback(err);
        } else {
          callback(null, userItems);
        }
      });
    }
  });
};
