'use strict';

// Generate video tag
var SERVICE_VIDEO = /(webm$|ogv$|mp4$)/i;

exports.process = function(media, remix) {
  var quoteFix = media.replace(/“|”|"|&gt;|&lt;|&quot;/gi, '');

  if (!remix.isMatched && quoteFix.match(SERVICE_VIDEO)) {
    var videoType = media.split('.');
    remix.isMatched = true;
    videoType = videoType[videoType.length - 1];

    var videoFormat = '';
    if(videoType === 'webm') {
      videoFormat = 'type="video/webm; codecs="theora, vorbis"';
    } else if(videoType === 'ogv') {
      videoFormat = 'type="video/ogg; codecs="vp8, vorbis"';
    }

    remix.result = '<div class="object-wrapper"><video controls="controls" preload="none" autobuffer>' +
      '<source src="' + quoteFix + '" ' + videoFormat + ' /></video></div><a href="' + quoteFix +
      '" target="_blank" class="media-off">' + media + '</a>';
  }
  return remix;
};
