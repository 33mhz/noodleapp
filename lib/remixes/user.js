'use strict';

var SERVICE_USER = /^@([A-Za-z0-9_]+)/ig;

// Generate link to App.net user
exports.process = function (media, remix) {
  var match = media.match(SERVICE_USER);
  if (!remix.isMatched && match) {
    remix.isMatched = true;
    remix.result = '<a href="/user/' + match[0].split('@')[1] + '">' + match[0] + '</a>' + media.replace(match[0], '');
  }
  return remix;
};
