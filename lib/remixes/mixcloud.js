'use strict';

// Generate Mixcloud iframe
var SERVICE_MIXCLOUD = /mixcloud\.com\/([A-Za-z0-9_]+)\/([A-Za-z0-9_]+)/i;
var request = require('request');
var qs = require('querystring');

exports.process = function(media, remix, url, callback) {
  if (!remix.isMatched && media.match(SERVICE_MIXCLOUD)) {
    var params = {
      format: 'json',
      url: media
    };

    request.get('http://www.mixcloud.com/oembed?' + qs.stringify(params), function(error, resp, body) {
      if(error) {
        callback(null, remix);

      } else {
        try {
          remix.isMatched = true;
          var jsonResp = JSON.parse(body);
          jsonResp.html = jsonResp.html.replace(/src="http:/, 'src="');
          remix.result = '<div class="object-wrapper">' + jsonResp.html + '</div><a href="' + media +
            '" target="_blank" class="media-off">' + media + '</a>';
          callback(null, remix);

        } catch(error) {
          callback(null, remix);
        }
      }
    });

  } else {
    callback(null, remix);
  }
};
