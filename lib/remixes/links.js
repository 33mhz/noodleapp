'use strict';

// Generate regular link
var SERVICE_LINK = /(http:\/\/?|https:\/\/)?[\S]+(\.[A-Z]+)+(:\d+)?\??(\S*)?/gi;

exports.process = function (media, remix, quoteFix) {
  var match = quoteFix.match(SERVICE_LINK);

  if (!remix.isMatched) {
    remix.isMatched = true;

    if (!quoteFix.match(/http:\/\//) && !media.match(/https:\/\//)) {
      quoteFix = 'http://' + quoteFix;
      match = ['http://' + match];
    }

    remix.result = '<a href="' + match[0] + '" target="_blank">' + media + '</a>';
  }

  return remix;
};
