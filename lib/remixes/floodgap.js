'use strict';

// Generate image link
var SERVICE_FLOODGAP = /(((www.floodgap\.com))\/\w\/\w+)/i;

exports.process = function(media, remix) {
  if (!remix.isMatched && media.link.match(SERVICE_FLOODGAP)) {
    var parts = media.link.split('/');
    var shortcode = parts[parts.length - 2];

    remix.isMatched = true;

    remix.result = (media.text != media.url) ? media.text + ' ' : '';
    remix.result += '<div class="image-wrapper"><a href="' + media.link + '">' +
      '<img src="//www.floodgap.com/iv-store/' + shortcode + '.jpg"/></a></div><a href="' + media.link +
      '" target="_blank" class="media-off">' + media.text + '</a>';
  }

  return remix;
};
