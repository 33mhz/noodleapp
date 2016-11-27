'use strict';

// Generate image link
var SERVICE_IMAGE = /((http|https):\/\/)?(\S)+\.(jpg|jpeg|png|gif)($|(#|\?))/gi;

exports.process = function(media, remix) {
  if (!remix.isMatched && media.link.match(SERVICE_IMAGE)) {
    remix.isMatched = true;
    remix.result = '<div class="image-wrapper"><a href="' + media.link + '" target="_blank">' +
      '<img src="' + media.link + '"></a></div><a href="' + media.link +
      '" target="_blank" class="media-off">' + media.text + '</a>';
  }

  return remix;
};
