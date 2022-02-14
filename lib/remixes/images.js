'use strict';

// Generate image link
var SERVICE_IMAGE = /((http|https):\/\/)?(\S)+\.(jpg|jpeg|png|gif)($|(#|\?))/i;

exports.process = function(media, remix) {
  if (!remix.isMatched && SERVICE_IMAGE.test(media.url)) {
    remix.isMatched = true;
    remix.result = media.text + '<div class="image-wrapper"><a href="' + media.url + '" target="_blank">' +
      '<img src="' + media.url + '"></a></div><a href="' + media.url +
      '" target="_blank" class="media-off">' + media.text + '</a>';
  }

  return remix;
};
