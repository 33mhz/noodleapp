'use strict';

// Generate Vimeo iframe
var SERVICE_VIMEO = /vimeo/i;

exports.process = function(media, remix, options) {
  if (!remix.isMatched && media.url.match(SERVICE_VIMEO)) {
    var url = media.url.split('/');
    var vimeoId = parseInt(url[url.length - 1], 10);

    if (!isNaN(vimeoId)) {
      remix.isMatched = true;

      remix.result = '<div class="object-wrapper"><iframe src="//player.vimeo.com/video/' + vimeoId + '" ' +
        'width="' + options.width + '" height="' + options.height + '" frameborder="0" ' +
        'webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe></div><a href="' + media.url +
        '" target="_blank" class="media-off">' + media.text + '</a>';

    } else {
      return remix;
    }
  }
  return remix;
};
