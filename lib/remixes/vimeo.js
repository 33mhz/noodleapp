'use strict';

// Generate Vimeo iframe
var SERVICE_VIMEO = /vimeo/i;

exports.process = function(media, remix, url, options) {
  var quoteFix = media.replace(/“|”|"|&gt;|&lt;|&quot;/gi, '');

  if (!remix.isMatched && quoteFix.match(SERVICE_VIMEO)) {
    var vimeoId = parseInt(url[url.length - 1], 10);

    if (!isNaN(vimeoId)) {
      remix.isMatched = true;

      remix.result = '<div class="object-wrapper"><iframe src="//player.vimeo.com/video/' + vimeoId + '" ' +
        'width="' + options.width + '" height="' + options.height + '" frameborder="0" ' +
        'webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe></div><a href="' + quoteFix +
        '" target="_blank" class="media-off">' + media + '</a>';

    } else {
      return remix;
    }
  }
  return remix;
};
