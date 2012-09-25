'use strict';

var SERVICE_USER = /^@(\S+)$/ig;

// Generate link to App.net user
exports.process = function (media, remix) {
  if (!remix.isMatched && media.match(SERVICE_USER)) {
    remix.isMatched = true;
    remix.result = '<a href="/user/' + media.split('@')[1].replace(/[^\w+]/g,'') + '">' + media + '</a>';
  }
  return remix;
};
