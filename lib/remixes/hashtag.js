'use strict';

var SERVICE_HASHTAG = /^#(\S+)$/ig;

// Generate link to App.net user
exports.process = function (media, remix) {
  if (!remix.isMatched && media.match(SERVICE_HASHTAG)) {
    remix.isMatched = true;
    var t = media.split('#')[1].replace(/[^\w+]/g, '');
    remix.result = '<a class="tags" href="/tagged/' +
      media.split('#')[1].replace(/[^a-z\u00E0-\u00FC]+$/i,'') + '">' + media + '</a>';
  }
  return remix;
};
