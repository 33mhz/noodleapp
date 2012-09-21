var webRemix = require('../lib/web-remix');
var nock = require('nock');
var should = require('should');

describe('web-remix', function() {
  describe('.generate',  function() {

    it('returns embed code for a youtu.be short url', function(done) {
      webRemix.generate('http://youtu.be/5cazkHAHiPU', function(err, subject) {
        subject.should.equal(' <iframe width="500" height="281" src="//www.youtube.com/embed/5cazkHAHiPU?wmode=transparent" ' +
        'frameborder="0" allowfullscreen></iframe><a href="//www.youtube.com/watch?v=5cazkHAHiPU" ' +
        'class="media-link" target="_blank">http://www.youtube.com/watch?v=5cazkHAHiPU</a>');
        done();
      });
    });

    it('returns embed code for a youtube normal url', function(done) {
      webRemix.generate('http://www.youtube.com/watch?v=5cazkHAHiPU', function(err, subject) {
        subject.should.equal(' <iframe width="500" height="281" src="//www.youtube.com/embed/5cazkHAHiPU?wmode=transparent" ' +
          'frameborder="0" allowfullscreen></iframe><a href="//www.youtube.com/watch?v=5cazkHAHiPU" ' +
          'class="media-link" target="_blank">http://www.youtube.com/watch?v=5cazkHAHiPU</a>');
        done();
      });
    });

    it('returns embed code for a vimeo video url', function(done) {
      webRemix.generate('http://vimeo.com/37872583', function(err, subject) {
        subject.should.equal(' <iframe src="//player.vimeo.com/video/37872583" width="500" height="281" ' +
          'frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>' +
          '<a href="http://vimeo.com/37872583" class="media-link" target="_blank">http://vimeo.com/37872583</a>');
        done();
      });
    });

    it('returns embed code for a mixcloud audio url', function(done) {
      webRemix.generate('http://www.mixcloud.com/LuckyMe/25-jamie-vexd-sunday-walkman-mix/', function(err, subject) {
        subject.should.equal(' <object width="440" height="251"><param name="movie" value="http://www.mixcloud.' +
          'com/media/swf/player/mixcloudLoader.swf?feed=http%3A//www.mixcloud.com/LuckyMe/25-jamie-vexd-sunday-' +
          'walkman-mix/&embed_type=widget_standard"></param><param name="allowFullScreen" value="false"></param>' +
          '<param name="wmode" value="opaque"></param><param name="allowscriptaccess" value="always"></param>' +
          '<embed src="//www.mixcloud.com/media/swf/player/mixcloudLoader.swf?feed=http%3A//www.mixcloud.com' +
          '/LuckyMe/25-jamie-vexd-sunday-walkman-mix/&embed_type=widget_standard" type="application/x-shockwave-' +
          'flash" wmode="opaque" allowscriptaccess="always" allowfullscreen="true" width="440" height="251"></embed>' +
          '</object><div style="clear:both; height:3px;"><div style="clear:both; height:3px;"></div></div><a href="' +
          'http%3A//www.mixcloud.com/LuckyMe/25-jamie-vexd-sunday-walkman-mix/" class="media-link" target="_blank">' +
          'http%3A//www.mixcloud.com/LuckyMe/25-jamie-vexd-sunday-walkman-mix/</a>');
        done();
      });
    });

    it('returns oembed code for a soundcloud url', function(done) {
      var scope = nock('soundcloud.com').get('/oembed?format=json&url=http//soundcloud.com/track').reply(200,
          { html: '<iframe src="//w.soundcloud.com/player/?url=http%3A' +
          '%2F%2Fapi.soundcloud.com%2Fplaylists%2F723408&amp;show_artwork=true" frameborder="no" height="450" ' +
          'scrolling="no" width="100%"></iframe><a class="media-link" target="_blank"' +
          'href="http://soundcloud.com/skeptical/sets/tracks-576/">http://soundcloud.com/skeptical/sets' +
          '/tracks-576/</a>' });
      webRemix.generate('http://soundcloud.com/skeptical/sets/tracks-576/', function(err, subject) {
        subject.should.equal(' <iframe width="100%" height="450" scrolling="no" frameborder="no" ' +
          'src="//w.soundcloud.com/player/?url=http%3A%2F%2Fapi.soundcloud.com%2Fplaylists%2F723408&show_artwork=true">' +
          '</iframe><a href="http://soundcloud.com/skeptical/sets/tracks-576/" class="media-link" target="_blank">' +
          'http://soundcloud.com/skeptical/sets/tracks-576/</a>');
        done();
      });
    });

    it('returns embed code for a rd.io short url', function(done) {
      webRemix.generate('http://rd.io/i/QVME9DdeW1GL', function(err, subject) {
        subject.should.equal(' <iframe class="rdio" width="450" height="80" ' +
          'src="//rd.io/i/QVME9DdeW1GL" ' +
          'frameborder="0"></iframe><a href="http://rd.io/x/QVME9DdeW1GL" ' +
          'class="media-link" target="_blank">http://rd.io/x/QVME9DdeW1GL</a>');
        done();
      });
    });

    it('returns embed code for a rdio normal url', function(done) {
      webRemix.generate('http://rdio.com/x/QVME9DdeW1GL', function(err, subject) {
        subject.should.equal(' <iframe class="rdio" width="450" height="80" ' +
          'src="//rd.io/i/QVME9DdeW1GL" ' +
          'frameborder="0"></iframe><a href="http://rd.io/x/QVME9DdeW1GL" ' +
          'class="media-link" target="_blank">http://rd.io/x/QVME9DdeW1GL</a>');
        done();
      });
    });

    it('returns image code for an img url', function() {
      webRemix.generate('http://3.bp.blogspot.com/_K_1LxF4TvhU/S7UUE6PYKiI/AAAAAAAADto/XfpdX2CIxqY/' +
        's400/Riley+the+smiling+dog.jpg', function(err, subject) {
        subject.should.equal(' <img src="http://3.bp.blogspot.com/_K_1LxF4TvhU/S7UUE6PYKiI/AAAAAAAADto/XfpdX2CIxqY/' +
          's400/Riley+the+smiling+dog.jpg"><a href="http://3.bp.blogspot.com/_K_1LxF4TvhU/S7UUE6PYKiI/AAAAAAAADto/Xf' +
          'pdX2CIxqY/s400/Riley+the+smiling+dog.jpg" class="media-link" target="_blank">' +
          'http://3.bp.blogspot.com/_K_1LxF4TvhU/S7UUE6PYKiI/AAAAAAAADto/XfpdX2CIxqY/s400/Riley+the+smiling+dog.jpg</a>');
      });
    });

    it('returns a link for an https url', function(done) {
      webRemix.generate('https://example.com', function(err, subject) {
        subject.should.equal(' <a href="https://example.com" target="_blank">https://example.com</a>');
        done();
      });
    });

    it('returns a link for an http url', function(done) {
      webRemix.generate('http://example.com', function(err, subject) {
        subject.should.equal(' <a href="http://example.com" target="_blank">http://example.com</a>');
        done();
      });
    });

    it('returns video for a video link', function(done) {
      var video = 'http://blah.com/video.ogv';
      webRemix.generate(video, function(err, subject) {
        subject.should.equal(' <video controls="controls" preload="none" autobuffer><source src="' + video +
          '" type="video/ogg; codecs="vp8, vorbis" /></video><a href="' + video + '" target="_blank">' + video + '</a>');
        done();
      });
    });

    it('returns audio for an audio link', function(done) {
      var audio = 'http://blah.com/audio.ogg';
      webRemix.generate(audio, function(err, subject) {
        subject.should.equal(' <audio controls="controls" preload="none" autobuffer><source src="' + audio +
          '" type="audio/ogg" /></audio><a href="' + audio + '" target="_blank">' + audio + '</a>');
        done();
      });
    });

    it('returns the plain text for anything else', function(done) {
      webRemix.generate('foo', function(err, subject) {
        subject.should.equal(' foo');
        done();
      });
    });
  });
});
