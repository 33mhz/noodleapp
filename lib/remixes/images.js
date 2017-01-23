'use strict';

// Generate image link
var SERVICE_IMAGE = /((http|https):\/\/)?(\S)+\.(jpg|jpeg|png|gif)($|(#|\?))/i;

exports.process = function(media, remix) {
  if (!remix.isMatched && SERVICE_IMAGE.test(media.link)) {
    remix.isMatched = true;
    remix.result = media.text + '<div class="image-wrapper"><a href="' + media.link + '" target="_blank">' +
      '<img src="' + media.link + '"></a></div><a href="' + media.link +
      '" target="_blank" class="media-off">' + media.text + '</a>';
  }

  return remix;
};
