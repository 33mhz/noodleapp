'use strict';

var SERVICE_HASHTAG = /#[A-Z0-9-_]+/ig;

// Generate link to App.net user
exports.process = function (media, remix) {
  var match = media.match(SERVICE_HASHTAG);

  if (!remix.isMatched && match) {
    var textArr = media.split(match[0]);
    var prefix = textArr[0];
    var suffix = textArr[1];
    remix.isMatched = true;
    var t = media.split('#')[1].replace(/[^\w+]/g, '');
    remix.result = prefix + '<a class="tags" href="/tagged/' +
      match[0].split('#')[1].replace(/[^a-z\u00E0-\u00FC]+$/i,'') + '">' + match[0] + '</a>' + suffix;
  }
  return remix;
};
