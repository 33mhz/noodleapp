'use strict';

var VIDEO_HEIGHT = 298;
var VIDEO_WIDTH = 530;

/* Embed media if it matches any of the following:
 * 1. Is a Youtube link
 * 2. Is a Vimeo link
 * 3. Is a general link
 * 4. Is a file with a jpg|jpeg|png|gif extension
 * 5. Is an video or audio extension matching mp3|ogg|webm|ogv|mp4
*/
exports.generate = function(content, callback) {
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

  // parse the current url to determine where to process it.
  var parseWords = function(media, callback) {
    var url = media.split('/');
    var protocol = url[0].toLowerCase();
    var remix = { result: '', isMatched: false };

    // get rid of any html
    media = media.replace(/</gm, '&lt;');
    media = media.replace(/>/gm, '&gt;');
    media = media.replace(/\"/gm, '&quot;');
    media = media.replace(/;base64/gm, '');

    if (protocol === 'http:' || protocol === 'https:') {
      // this is a link, so let's do some more analysis
      matchSoundCloud.process(media, remix, url, function(errSndCld, remix) {
        if (errSndCld) {
          callback(errSndCld);

        } else {
          //console.log('landed ', remix)
          if (!remix.isMatched) {
            remix = matchMixCloud.process(media, remix, { width: VIDEO_WIDTH - 60, height: VIDEO_HEIGHT - 30 });
            remix = matchYoutube.process(media, remix, url, { width: VIDEO_WIDTH, height: VIDEO_HEIGHT });
            remix = matchRdio.process(media, remix, url);
            remix = matchVimeo.process(media, remix, url, { width: VIDEO_WIDTH, height: VIDEO_HEIGHT });
            remix = matchImages.process(media, remix);
            remix = matchInstagram.process(media, remix);
            remix = matchAudio.process(media, remix);
            remix = matchVideo.process(media, remix);
            remix = matchUser.process(media, remix);
            remix = matchLinks.process(media, remix);
          }

          callback(null, remix.result);
        }
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
  var contentArray = content.split(/\s/);

  contentArray.forEach(function(contentArrayItem, counter) {
    parseWords(contentArrayItem, function(err, contentResp) {
      if (err) {
        callback(err);

      } else {
        newContent.push(contentResp);

        if (newContent.length === contentArray.length) {
          callback(null, newContent.join(' '));
        }
      }
    });
  });
};
