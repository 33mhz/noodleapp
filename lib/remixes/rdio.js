'use strict';

// Generate Rdio iframe
var SERVICE_RDIO = /(((rdio\.com)|(rd\.io))\/\w\/\w+)/i;

exports.process = function(media, remix, url) {
  var quoteFix = media.replace(/“|”|"|&gt;|&lt;|&quot;/gi, '');

  if (!remix.isMatched && quoteFix.match(SERVICE_RDIO)) {
    var rdioId = url[url.length -1];

    try {
      remix.isMatched = true;
      remix.result = '<div class="object-wrapper"><iframe class="rdio" width="450" height="80" ' +
        'src="//rd.io/i/' + rdioId + '" frameborder="0"></iframe></div><a href="' + quoteFix +
        '" target="_blank" class="media-off">' + media + '</a>';
    } catch(err) {
      return remix;
    }
  }
  return remix;
};
