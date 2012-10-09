'use strict';

var request = require('request');

// Get the real url if this is a short url
// Assuming short urls are under 25 characters
exports.process = function(media, url, callback) {
  var resp = {
    media: media,
    url: url
  };

  if (media.length < 24) {
    request({
      method: 'HEAD',
      url: media,
      followAllRedirects: true }, function (err, response) {
        if (err) {
          callback(null, resp);

        } else {
          var resp = {
            media: response.request.href,
            url: response.request.href.split('/')
          }
          callback(null, resp);
        }
    });
  } else {
    callback(null, resp);
  }
};
