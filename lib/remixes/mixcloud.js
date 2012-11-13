'use strict';

// Generate Mixcloud iframe
var SERVICE_MIXCLOUD = /mixcloud\.com\/[A-Z0-9-_]+\/[A-Z0-9-_]+/gi;
var request = require('request');
var qs = require('querystring');

exports.process = function(media, remix, callback) {
  process.nextTick(function() {
    if (!remix.isMatched && media.url.match(SERVICE_MIXCLOUD)) {
      var params = {
        format: 'json',
        url: media.url
      };

      request.get('http://www.mixcloud.com/oembed?' + qs.stringify(params), function(err, resp, body) {
        if (err) {
          callback(null, remix);

        } else {
          try {
            remix.isMatched = true;
            var jsonResp = JSON.parse(body);
            jsonResp.html = jsonResp.html.replace(/src="http:/, 'src="');
            remix.result = '<div class="object-wrapper">' + jsonResp.html + '</div><a href="' + media.url +
              '" target="_blank" class="media-off">' + media.text + '</a>';
            callback(null, remix);

          } catch(error) {
            callback(null, remix);
          }
        }
      });

    } else {
      callback(null, remix);
    }
  });
};
