'use strict';

var SERVICE_HASHTAG = /^#(\S+)$/ig;

// Generate link to App.net user
exports.process = function (media, remix) {
  if (!remix.isMatched && media.match(SERVICE_HASHTAG)) {
    remix.isMatched = true;
    var t = media.split('#')[1].replace(/[^\w+]/g, '');
    remix.result = '<a href="/tagged/' + media.split('#')[1].replace(/[^\w+]/g,'') + '">' + media + '</a>';
  }
  return remix;
};
