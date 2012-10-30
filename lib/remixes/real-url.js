'use strict';

var request = require('request');

var URL_BITLY = /bit\.ly\//;
var URL_ISGD = /is\.gd\//;
var URL_TCO = /t\.co\//;
var URL_JMP = /j\.mp\//;
var URL_TINYURL = /tinyurl\.com\//;
var URL_GOOGLE = /goo\.gl\//;

// Get the real url if this is a short url
// Assuming short urls are under 25 characters
exports.process = function(media, remix, client, callback) {
  var resp = {
    text: media.text,
    url: media.url
  };

  if (media.url.length < 28 &&
     (media.url.match(URL_BITLY) ||
     media.url.match(URL_ISGD) ||
     media.url.match(URL_TCO) ||
     media.url.match(URL_JMP) ||
     media.url.match(URL_TINYURL) ||
     media.url.match(URL_GOOGLE))) {

    client.get('shorturl:' + media.url, function(err, url) {
      if (err) {
        callback(null, media.url);

      } else {
        if (!url) {
          request({
            method: 'HEAD',
            url: media.url,
            followAllRedirects: true }, function (errCheck, response) {
              if (errCheck) {
                callback(null, resp);

              } else {
                resp.url = response.request.href;

                client.set('shorturl:' + media.url, response.request.href);
                client.expire('shorturl:' + media.url, 60 * 60 * 6); // 6 hours
                callback(null, resp);
              }
          });

        } else {
          resp.url = url;

          callback(null, resp);
        }
      }
    });

  } else {
    callback(null, resp);
  }
};
