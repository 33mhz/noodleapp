'use strict';

// Generate audio tag
var SERVICE_AUDIO = /(mp3)|(ogg)$/i;

exports.process = function(media, remix) {
  if (!remix.isMatched && media.match(SERVICE_AUDIO)) {
    var audioType = media.split('.');
    remix.isMatched = true;

    audioType = audioType[audioType.length - 1];
    remix.result = '<div class="object-wrapper"><audio controls="controls" preload="none" autobuffer>' +
      '<source src="' + media + '" type="audio/' + audioType + '" /></audio></div>';
  }
  return remix;
};

exports.processMinimal = function(media, remix) {
  if (!remix.isMatched && media.match(SERVICE_AUDIO)) {
    var audioType = media.split('.');
    remix.isMatched = true;

    audioType = audioType[audioType.length - 1];
    remix.result = '<div class="object-wrapper"><audio controls="controls" preload="none" autobuffer>' +
      '<source src="' + media + '" type="audio/' + audioType + '" /></audio></div>';
  }
  return remix;
};
