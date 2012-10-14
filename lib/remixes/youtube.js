'use strict';

// Generate Youtube iframe
var SERVICE_YOUTUBE = /(youtube)|(youtu\.be)/i;

exports.process = function(media, remix, url, quoteFix, options) {
  if (!remix.isMatched && quoteFix.match(SERVICE_YOUTUBE)) {
    var youtubeId = '';

    try {
      remix.isMatched = true;
      if (media.indexOf('youtu.be') > -1) {
        youtubeId = url[url.length - 1];
      } else {
        youtubeId = url[url.length - 1].split('v=')[1].split('&')[0];
      }
      remix.result = '<div class="object-wrapper"><iframe width="' + options.width + '" height="' + options.height + '" ' +
        'src="//www.youtube.com/embed/' + youtubeId + '?wmode=transparent" frameborder="0" ' +
        'allowfullscreen></iframe></div><a href="' + quoteFix + '" target="_blank" class="media-off">' + media + '</a>';

    } catch(err) {
      return remix;
    }
  }

  return remix;
};
