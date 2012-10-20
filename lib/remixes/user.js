'use strict';

var SERVICE_USER = /@[A-Z0-9_-]+/ig;

// Generate link to App.net user
exports.process = function (media, remix) {
  var match = media.match(SERVICE_USER);

  if (!remix.isMatched && match) {
    var textArr = media.split(match[0]);
    var prefix = textArr[0];
    var suffix = textArr[1];
    remix.isMatched = true;
    remix.result = prefix + '<a href="/user/' + match[0].split('@')[1] + '/">' + match[0] + '</a>' + suffix;
  }
  return remix;
};
