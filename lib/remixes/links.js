'use strict';

// Generate regular link
var SERVICE_LINK = /((http|https|ftp|scp|sftp):\/\/)?[A-Z0-9-_]+(\.{1}[A-Z0-9-_]+)?\.{1}[A-Z]{2,4}(:\d+)?(\S+)?/gi;

exports.process = function (media, remix, quoteFix) {
  var match = quoteFix.match(SERVICE_LINK);

  if (!remix.isMatched && match) {
    remix.isMatched = true;
    var newMatch = match;

    if (!quoteFix.match(/(http|https|ftp|scp|sftp):\/\//)) {
      quoteFix = 'http://' + quoteFix;
      newMatch = ['http://' + match];
    }

    var textArr = media.split(match[0]);
    var prefix = textArr[0];
    var suffix = textArr[1];

    remix.result = prefix  + '<a href="' + newMatch[0] + '" target="_blank">' + match[0] + '</a>' + suffix;
  }

  return remix;
};
