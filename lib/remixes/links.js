'use strict';

// Generate regular link
exports.process = function (media, remix) {
  if (!remix.isMatched) {
    remix.isMatched = true;

    remix.result = '<a href="' + media + '" target="_blank">' + media + '</a>';
  }
  return remix;
};
