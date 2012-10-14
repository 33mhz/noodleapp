'use strict';

// Generate image link
var SERVICE_IMAGE = /\.(jpg$|jpeg$|png$|gif$)/i;

exports.process = function(media, remix, quoteFix) {
  if (!remix.isMatched && quoteFix.match(SERVICE_IMAGE) &&
      media !== '/images/heart.png') {
    remix.isMatched = true;

    remix.result = '<div class="image-wrapper"><img src="' + quoteFix + '"></div><a href="' + quoteFix +
      '" target="_blank" class="media-off">' + media + '</a>';
  }
  return remix;
};
