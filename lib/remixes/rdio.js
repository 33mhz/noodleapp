'use strict';

// Generate Rdio iframe
var SERVICE_RDIO = /(((rdio\.com)|(rd\.io))\/[A-Z0-9-_]+\/[A-Z0-9-_]+)/gi;

exports.process = function(media, remix) {
  if (!remix.isMatched && media.link.match(SERVICE_RDIO)) {
    var url = media.link.split('/');
    var rdioId = url[url.length -1];

    try {
      remix.isMatched = true;
      remix.result = media.text + '<div class="object-wrapper"><iframe class="rdio" width="450" height="80" ' +
        'src="//rd.io/i/' + rdioId + '" frameborder="0"></iframe></div><a href="' + media.link +
        '" target="_blank" class="media-off">' + media.text + '</a>';
    } catch(err) {
      return remix;
    }
  }
  return remix;
};
