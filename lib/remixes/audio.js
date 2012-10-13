'use strict';

// Generate audio tag
var SERVICE_AUDIO = /ogg$/i;

exports.process = function(media, remix) {
  if (!remix.isMatched && media.match(SERVICE_AUDIO)) {
    var audioType = media.split('.');
    remix.isMatched = true;

    audioType = audioType[audioType.length - 1];
    remix.result = '<div class="object-wrapper"><audio controls="controls" preload="none" autobuffer>' +
      '<source src="' + media + '" type="audio/' + audioType + '" /></audio></div><a href="' + media +
      '" target="_blank" class="media-off">' + media + '</a>';
  }
  return remix;
};
