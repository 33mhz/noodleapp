'use strict';

// Generate video tag
var SERVICE_VIDEO = /(webm$|ogv$|mp4$)/i;

exports.process = function(media, remix) {
  if (!remix.isMatched && media.url.match(SERVICE_VIDEO)) {
    var videoType = media.url.split('.');
    remix.isMatched = true;
    videoType = videoType[videoType.length - 1];

    var videoFormat = '';
    if(videoType === 'webm') {
      videoFormat = 'type="video/webm; codecs="theora, vorbis"';
    } else if(videoType === 'ogv') {
      videoFormat = 'type="video/ogg; codecs="vp8, vorbis"';
    }

    remix.result = '<div class="object-wrapper"><video controls="controls" preload="none" autobuffer>' +
      '<source src="' + media.url + '" ' + videoFormat + ' /></video></div><a href="' + media.url +
      '" target="_blank" class="media-off">' + media.text + '</a>';
  }
  return remix;
};
