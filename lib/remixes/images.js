'use strict';

// Generate image link
var SERVICE_IMAGE = /\.((jpg)|(jpeg)|(png)|(gif))$/i;

exports.process = function(media, remix) {
  if (!remix.isMatched && media.match(SERVICE_IMAGE) &&
      media !== '/images/heart.png') {
    remix.isMatched = true;

    remix.result = '<img src="' + media + '">';
  }
  return remix;
};
