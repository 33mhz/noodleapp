'use strict';

// Generate Soundcloud iframe
var SERVICE_SOUNDCLOUD = /\/\/soundcloud\.com\/([A-Za-z0-9_]+)\/([A-Za-z0-9_]+)/i;
var request = require('request');
var qs = require('querystring');

exports.process = function(media, remix, url, callback) {
  if (!remix.isMatched && media.match(SERVICE_SOUNDCLOUD)) {
    // strip out periods
    media = media.replace(/(\.|!)$/, '');
    var params = {
      format: 'json',
      url: media
    };

    request.get('http://soundcloud.com/oembed?' + qs.stringify(params), function(error, resp, body) {
      if(error) {
        callback(null, remix);

      } else {
        try {
          remix.isMatched = true;
          var jsonResp = JSON.parse(body);
          jsonResp.html = jsonResp.html.replace(/src="http:/, 'src="');
          remix.result = '<div class="object-wrapper">' + jsonResp.html + '</div>';
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
