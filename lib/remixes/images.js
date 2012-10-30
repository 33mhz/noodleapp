'use strict';

// Generate image link
var SERVICE_IMAGE = /((http|https):\/\/)?(\S)+\.(jpg|jpeg|png|gif)($|(#|\?))/gi;

exports.process = function(media, remix) {
  if (!remix.isMatched && media.url.match(SERVICE_IMAGE)) {
    remix.isMatched = true;
    remix.result = '<div class="image-wrapper"><a href="' + media.url + '" target="_blank">' +
      '<img src="' + media.url + '"></a></div><a href="' + media.url +
      '" target="_blank" class="media-off">' + media.text + '</a>';
  }

  return remix;
};
