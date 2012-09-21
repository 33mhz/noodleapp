'use strict';

// Generate Vimeo iframe
var SERVICE_VIMEO = /vimeo/i;

exports.process = function(media, remix, url, options) {
  if (!remix.isMatched && media.match(SERVICE_VIMEO)) {
    var vimeoId = parseInt(url[url.length - 1], 10);

    if (!isNaN(vimeoId)) {
      remix.isMatched = true;

      remix.result = '<iframe src="//player.vimeo.com/video/' + vimeoId + '" ' +
       'width="' + options.width + '" height="' + options.height + '" frameborder="0" ' +
       'webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>' +
       '<a href="http://vimeo.com/' + vimeoId + '" ' +
       'class="media-link" target="_blank">http://vimeo.com/' + vimeoId + '</a>';

    } else {
      return remix;
    }
  }
  return remix;
};
