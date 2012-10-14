'use strict';

// Generate audio tag
var SERVICE_AUDIO = /ogg$/i;

exports.process = function(media, remix, quoteFix) {
  if (!remix.isMatched && quoteFix.match(SERVICE_AUDIO)) {
    var audioType = quoteFix.split('.');
    remix.isMatched = true;

    audioType = audioType[audioType.length - 1];
    remix.result = '<div class="object-wrapper"><audio controls="controls" preload="none" autobuffer>' +
      '<source src="' + quoteFix + '" type="audio/' + audioType + '" /></audio></div><a href="' + quoteFix +
      '" target="_blank" class="media-off">' + media + '</a>';
  }
  return remix;
};
