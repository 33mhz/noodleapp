'use strict';

var request = require('request');

var URL_BITLY = /bit\.ly\//;
var URL_ISGD = /is\.gd\//;
var URL_TCO = /t\.co\//;
var URL_JMP = /j\.mp\//;

// Get the real url if this is a short url
// Assuming short urls are under 25 characters
exports.process = function(media, url, client, callback) {
  var resp = {
    media: media,
    url: url
  };

  if (media.length < 25 &&
     (media.match(URL_BITLY) ||
     media.match(URL_ISGD) ||
     media.match(URL_TCO) ||
     media.match(URL_JMP))) {

    if (!media.match(/^http:\/\//) && !media.match(/^https:\/\//)) {
      media = 'http://' + media;
    }

    client.get('shorturl:' + media, function(err, url) {
      if (err) {
        callback(null, resp);

      } else {
        if (!url) {
          request({
            method: 'HEAD',
            url: media,
            followAllRedirects: true }, function (errCheck, response) {
              if (errCheck) {
                callback(null, resp);

              } else {
                resp = {
                  media: response.request.href,
                  url: response.request.href.split('/')
                }

                client.set('shorturl:' + media, response.request.href);
                client.expire('shorturl:' + media, 60 * 60 * 12) // 12 hours
                callback(null, resp);
              }
          });

        } else {
          resp = {
            media: url,
            url: url.split('/')
          }

          callback(null, resp);
        }
      }
    });

  } else {
    callback(null, resp);
  }
};
