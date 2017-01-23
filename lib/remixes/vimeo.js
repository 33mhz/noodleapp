'use strict';

// Generate Vimeo iframe
var SERVICE_VIMEO = /vimeo/i;

exports.process = function(media, remix, options) {
  if (!remix.isMatched && SERVICE_VIMEO.test(media.link)) {
    var url = media.link.split('/');
    var vimeoId = parseInt(url[url.length - 1], 10);

    if (!isNaN(vimeoId)) {
      remix.isMatched = true;

      remix.result = media.text + '<div class="object-wrapper"><iframe src="//player.vimeo.com/video/' + vimeoId + '" ' +
        'width="' + options.width + '" height="' + options.height + '" frameborder="0" ' +
        'webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe></div><a href="' + media.link +
        '" target="_blank" class="media-off">' + media.text + '</a>';

    } else {
      return remix;
    }
  }
  return remix;
};
