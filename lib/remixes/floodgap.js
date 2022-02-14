'use strict';

// Generate image link
var SERVICE_FLOODGAP = /((www.floodgap\.com)\/(iv|gld)\/\d+)/i;

exports.process = function(media, remix) {
  if (!remix.isMatched && SERVICE_FLOODGAP.test(media.url)) {
    var parts = media.url.split('/');
    var fgid = parts[parts.length - 2];
    var shortcode = parts[parts.length - 1];

    remix.isMatched = true;

    remix.result = (media.text != media.url) ? media.text + ' ' : '';
    remix.result += '<div class="image-wrapper"><a href="' + media.url + '">' +
      '<img src="http://www.floodgap.com/' + fgid + '-store/' + shortcode + '.jpg"/></a></div><a href="' + media.url +
      '" target="_blank" class="media-off">' + media.text + '</a>';
  }

  return remix;
};
