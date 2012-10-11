'use strict';

// Generate regular link
exports.process = function (media, remix) {
  if (!remix.isMatched) {
    if (!media.match(/^http:\/\//) && !media.match(/^https:\/\//)) {
      media = 'http://' + media;
    }
    remix.isMatched = true;
    remix.result = '<a href="' + media + '" target="_blank">' + media + '</a>';
  }

  return remix;
};
