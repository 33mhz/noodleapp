'use strict';

var VIDEO_HEIGHT = 295;
var VIDEO_WIDTH = 525;

/* Embed media if it matches any of the following:
 * 1. Is a Youtube link
 * 2. Is a Vimeo link
 * 3. Is an Rdio link
 * 4. Is an Instagram link
 * 5. Is a Mixcloud link
 * 6. Is a general link
 * 7. Is a file with a jpg|jpeg|png|gif extension
 * 8. Is an video extension matching ogg|webm|mp4
 */
exports.generate = function(media, client, callback) {
  var remix = {
    isMatched: false,
    result: media
  };

  var matchYoutube = require('./remixes/youtube');
  var matchVimeo = require('./remixes/vimeo');
  var matchSoundCloud = require('./remixes/soundcloud');
  var matchMixCloud = require('./remixes/mixcloud');
  var matchRdio = require('./remixes/rdio');
  var matchImages = require('./remixes/images');
  var matchInstagram = require('./remixes/instagram');
  var matchVideo = require('./remixes/video');
  var matchShortUrl = require('./remixes/real-url');

  var checkRemixes = function(media, remix, callback) {
    remix = matchYoutube.process(media, remix, { width: VIDEO_WIDTH, height: VIDEO_HEIGHT });
    remix = matchRdio.process(media, remix);
    remix = matchVimeo.process(media, remix, { width: VIDEO_WIDTH, height: VIDEO_HEIGHT });
    remix = matchImages.process(media, remix);
    remix = matchInstagram.process(media, remix);
    remix = matchVideo.process(media, remix);

    if (!remix.isMatched) {
      matchShortUrl.process(media, remix, client, function(err, remix) {
        remix = {
          isMatched: true,
          result: '<a href="' + remix.url + '" target="_blank">' + remix.text + '</a>'
        };

        callback(remix);
      });
    } else {
      callback(remix);
    }
  };

  matchSoundCloud.process(media, remix, function(errSndCld, remix) {
    if (errSndCld) {
      callback(errSndCld);

    } else {
      if (!remix.isMatched) {
        matchMixCloud.process(media, remix, function(errMixCld, remix) {
          if (!remix.isMatched) {
            checkRemixes(media, remix, function(remix) {
              callback(null, remix.result);
            });
          }
        });

      } else {
        callback(null, remix.result);
      }
    }
  });
};
