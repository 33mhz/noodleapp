'use strict';

// Generate audio tag
var SERVICE_AUDIO = /(mp3)|(ogg)$/i;

exports.process = function(media, remix) {
  if (!remix.isMatched && media.match(SERVICE_AUDIO)) {
    var audioType = media.split('.');
    remix.isMatched = true;

    audioType = audioType[audioType.length - 1];
    remix.result = '<audio controls="controls" preload="none" autobuffer>' +
      '<source src="' + media + '" type="audio/' + audioType + '" /></audio>' +
      '<a href="' + media + '" target="_blank">' + media + '</a>';
  }
  return remix;
};
