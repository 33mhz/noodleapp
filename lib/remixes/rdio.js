'use strict';

// Generate Rdio iframe
var SERVICE_RDIO = /(((rdio\.com)|(rd\.io))\/\w\/\w+)/i;

exports.process = function(media, remix, url) {
  if (!remix.isMatched && media.match(SERVICE_RDIO)) {
    var rdioId = url[url.length -1];

    try {
      remix.isMatched = true;
      remix.result = '<iframe class="rdio" width="450" height="80" ' +
        'src="//rd.io/i/' + rdioId + '" frameborder="0"></iframe>' +
        '<a href="http://rd.io/x/' + rdioId + '" ' +
        'class="media-link" target="_blank">http://rd.io/x/' + rdioId + '</a>';
    } catch(err) {
      return remix;
    }
  }
  return remix;
};
