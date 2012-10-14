'use strict';

// Generate regular link
var SERVICE_LINK = /(http:\/\/?|https:\/\/)?[\w-]+(\.[A-Za-z]+)+\.?(:\d+)?(\/\S*)?/gi;

exports.process = function (media, remix) {
  var match = media.match(SERVICE_LINK);

  if (!remix.isMatched) {
    remix.isMatched = true;

    if (!media.match(/http:\/\//) && !media.match(/https:\/\//)) {
      media = 'http://' + media;
      match = ['http://' + match];
    }

    remix.result = '<a href="' + match[0].replace(/“|”|"|&gt;|&lt;|&quot;/gi, '') + '" target="_blank">' + media + '</a>';
  }

  return remix;
};
