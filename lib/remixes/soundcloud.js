// Generate Soundcloud iframe
var SERVICE_SOUNDCLOUD = /soundcloud/i;
var request = require('request');

exports.process = function(media, remix, url, callback) {
  if (!remix.isMatched && media.match(SERVICE_SOUNDCLOUD)) {
    request.get('http://soundcloud.com/oembed?format=json&url=' + media, function(error, resp, body) {
      if(error) {
        return media;
      }

      try {
        remix.isMatched = true;
        var jsonResp = JSON.parse(body);

        jsonResp.html = jsonResp.html.replace(/src="http:/, 'src="');

        remix.result = jsonResp.html + '<a href="' + media + '" class="media-link" target="_blank">' + media + '</a>';
        return callback(null, remix);
      } catch(error) {
        return callback(null, remix);
      }
    });
  } else {
    return callback(null, remix);
  }
};
