'use strict';

var matchYoutube = require('./remixes/youtube');
var matchVimeo = require('./remixes/vimeo');
var matchSoundCloud = require('./remixes/soundcloud');
var matchRdio = require('./remixes/rdio');
var matchImages = require('./remixes/images');
var matchInstagram = require('./remixes/instagram');

var VIDEO_HEIGHT = 295;
var VIDEO_WIDTH = 525;

var checkRemixes = function(media, remix, client) {
  remix = matchYoutube.process(media, remix, { width: VIDEO_WIDTH, height: VIDEO_HEIGHT });
  remix = matchRdio.process(media, remix);
  remix = matchVimeo.process(media, remix, { width: VIDEO_WIDTH, height: VIDEO_HEIGHT });
  remix = matchImages.process(media, remix);
  remix = matchInstagram.process(media, remix);

  if (!remix.isMatched) {
    remix.isMatched = true;
    remix.result = '<a href="' + remix.result.url + '" target="_blank">' + remix.result.url + '</a>';
  }

  return remix;
};

/* Embed media if it matches any of the following:
 * 1. Is a Youtube link
 * 2. Is a Vimeo link
 * 3. Is an Rdio link
 * 4. Is an Instagram link
 * 5. Is a file with a jpg|jpeg|png|gif extension
 */
exports.generate = function(media, client, callback) {
  process.nextTick(function() {
    var remix = {
      isMatched: false,
      result: media
    };

    matchSoundCloud.process(media, remix, function(errSndCld, remix) {
      if (errSndCld) {
        callback(errSndCld);

      } else {
        if (!remix.isMatched) {
          callback(null, checkRemixes(media, remix, client).result);
        } else {
          callback(null, remix.result);
        }
      }
    });
  });
};
