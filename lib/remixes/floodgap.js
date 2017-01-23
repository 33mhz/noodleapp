'use strict';

// Generate image link
var SERVICE_FLOODGAP = /((www.floodgap\.com)\/iv\/\d+)/i;

exports.process = function(media, remix) {
  if (!remix.isMatched && SERVICE_FLOODGAP.test(media.link)) {
    var parts = media.link.split('/');
    var shortcode = parts[parts.length - 1];

    remix.isMatched = true;

    remix.result = (media.text != media.url) ? media.text + ' ' : '';
    remix.result += '<div class="image-wrapper"><a href="' + media.link + '">' +
      '<img src="http://www.floodgap.com/iv-store/' + shortcode + '.jpg"/></a></div><a href="' + media.link +
      '" target="_blank" class="media-off">' + media.text + '</a>';
  }

  return remix;
};
