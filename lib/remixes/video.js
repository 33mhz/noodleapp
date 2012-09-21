'use strict';

// Generate video tag
var SERVICE_VIDEO = /(webm)|(ogv)|(mp4)$/i;

exports.process = function(media, remix) {
  if (!remix.isMatched && media.match(SERVICE_VIDEO)) {
    var videoType = media.split('.');
    remix.isMatched = true;
    videoType = videoType[videoType.length - 1];

    var videoFormat = '';
    if(videoType === 'webm') {
      videoFormat = 'type="video/webm; codecs="theora, vorbis"';
    } else if(videoType === 'ogv') {
      videoFormat = 'type="video/ogg; codecs="vp8, vorbis"';
    }

    remix.result = '<video controls="controls" preload="none" autobuffer>' +
      '<source src="' + media + '" ' + videoFormat + ' /></video>' +
      '<a href="' + media + '" target="_blank">' + media + '</a>';
  }
  return remix;
};
