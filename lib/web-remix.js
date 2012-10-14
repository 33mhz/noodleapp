'use strict';

var VIDEO_HEIGHT = 298;
var VIDEO_WIDTH = 530;

/* Embed media if it matches any of the following:
 * 1. Is a Youtube link
 * 2. Is a Vimeo link
 * 3. Is an Rdio link
 * 4. Is an Instagram link
 * 5. Is a Mixcloud link
 * 6. Is a general link
 * 7. Is a file with a jpg|jpeg|png|gif extension
 * 8. Is an video or audio extension matching ogg|webm|ogv|mp4
 */
exports.generate = function(content, client, callback) {
  var result = '';
  var matchYoutube = require('./remixes/youtube');
  var matchVimeo = require('./remixes/vimeo');
  var matchSoundCloud = require('./remixes/soundcloud');
  var matchMixCloud = require('./remixes/mixcloud');
  var matchRdio = require('./remixes/rdio');
  var matchImages = require('./remixes/images');
  var matchInstagram = require('./remixes/instagram');
  var matchAudio = require('./remixes/audio');
  var matchVideo = require('./remixes/video');
  var matchUser = require('./remixes/user');
  var matchHashtag = require('./remixes/hashtag');
  var matchLinks = require('./remixes/links');
  var getRealUrl = require('./remixes/real-url');
  var LINK_FORMAT = /[\w-]+(\.[A-Za-z]+)+\.?(:\d+)?(\/\S*)?/gi;
  var QUOTE_FIX = /“|”|"|&gt;|&lt;|&quot;|\(|\)|\[|\]/gi;

  var checkRemixes = function(remix, media, url, quoteFix) {
    remix = matchYoutube.process(media, remix, url, quoteFix, { width: VIDEO_WIDTH, height: VIDEO_HEIGHT });
    remix = matchRdio.process(media, remix, url, quoteFix);
    remix = matchVimeo.process(media, remix, url, quoteFix, { width: VIDEO_WIDTH, height: VIDEO_HEIGHT });
    remix = matchImages.process(media, remix, quoteFix);
    remix = matchInstagram.process(media, remix, quoteFix);
    remix = matchAudio.process(media, remix, quoteFix);
    remix = matchVideo.process(media, remix, quoteFix);
    remix = matchUser.process(media, remix);
    remix = matchLinks.process(media, remix, quoteFix);

    return remix;
  };

  // parse the current url to determine where to process it.
  var parseWords = function(media, client, callback) {
    var url = media.split('/');
    var protocol = url[0].toLowerCase();
    var remix = { result: '', isMatched: false };

    // get rid of any html
    media = media.replace(/</gm, '&lt;');
    media = media.replace(/>/gm, '&gt;');
    media = media.replace(/\"/gm, '&quot;');
    media = media.replace(/;base64/gm, '');

    if (protocol === 'http:' || protocol === 'https:' || media.match(LINK_FORMAT)) {
      // this is a link, so let's do some more analysis
      var quoteFix = media.replace(QUOTE_FIX, '');
      url = quoteFix.split('/');

      getRealUrl.process(media, url, quoteFix, client, function(errUrl, resp) {
        url = resp.url || url;
        media = resp.media || media;

        quoteFix = media.replace(QUOTE_FIX, '');
        url = quoteFix.split('/');

        matchSoundCloud.process(media, remix, url, quoteFix, function(errSndCld, remix) {
          if (errSndCld) {
            callback(errSndCld);

          } else {
            if (!remix.isMatched) {
              matchMixCloud.process(media, remix, url, quoteFix, function(errMixCld, remix) {
                if (!remix.isMatched) {
                  remix = checkRemixes(remix, media, url, quoteFix);
                }

                callback(null, remix.result);
              });
            } else {
              callback(null, remix.result);
            }
          }
        });
      });
    } else {
      remix = matchHashtag.process(media, remix);
      remix = matchUser.process(media, remix);

      if (!remix.isMatched) {
        callback(null, media);
      } else {
        callback(null, remix.result);
      }
    }
  };

  var newContent = [];
  var contentArray = content.split(/( |\n|\r)/g);

  contentArray.forEach(function(contentArrayItem, counter) {
    parseWords(contentArrayItem, client, function(err, contentResp) {
      if (err) {
        callback(err);

      } else {
        newContent.push(contentResp.replace(/(\n|\r)/gm, '<br> '));

        if (newContent.length === contentArray.length) {
          callback(null, newContent.join(' '));
        }
      }
    });
  });
};
