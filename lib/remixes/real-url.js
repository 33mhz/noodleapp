'use strict';

var request = require('request');

var URL_BITLY = /bit\.ly\//;
var URL_ISGD = /is\.gd\//;
var URL_TCO = /t\.co\//;
var URL_JMP = /j\.mp\//;
var URL_TINYURL = /tinyurl\.com\//;

// Get the real url if this is a short url
// Assuming short urls are under 25 characters
exports.process = function(media, url, client, quoteFix, callback) {
  var resp = {
    media: media,
    url: url
  };

  if (quoteFix.length < 28 &&
     (quoteFix.match(URL_BITLY) ||
     quoteFix.match(URL_ISGD) ||
     quoteFix.match(URL_TCO) ||
     quoteFix.match(URL_JMP) ||
     quoteFix.match(URL_TINYURL))) {

    if (!media.match(/^http:\/\//) && !media.match(/^https:\/\//)) {
      media = 'http://' + media;
      quoteFix = 'http://' + quoteFix;
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

                client.set('shorturl:' + quoteFix, response.request.href);
                client.expire('shorturl:' + quoteFix, 60 * 60 * 12) // 12 hours
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
