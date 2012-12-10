/*global describe:true it:true */
'use strict';

var express = require('express');
var configurations = module.exports;
var app = express();
var server = require('http').createServer(app);
var webRemix = require('../lib/web-remix');
var nock = require('nock');
var should = require('should');
var redis = require('redis');
var client = redis.createClient();
var qs = require('querystring');

client.select(app.set('redisnoodleapp'), function(errDb, res) {
  console.log('TEST database connection status: ', res);
});

describe('web-remix', function() {
  after(function() {
    client.flushdb();
    console.log('cleared test database');
  });
  describe('.generate',  function() {
    it('returns embed code for a youtu.be short url', function(done) {
      var youtube = { text: 'http://youtu.be/5cazkHAHiPU', url: 'http://youtu.be/5cazkHAHiPU' };
      webRemix.generate(youtube, client, function(err, subject) {
        subject.should.equal('<div class="object-wrapper"><iframe width="525" height="295" src="//www.youtube.com/embed/5cazkHAHiPU?wmode=transparent" ' +
        'frameborder="0" allowfullscreen></iframe></div><a href="http://youtu.be/5cazkHAHiPU" target="_blank" class="media-off">http://youtu.be/5cazkHAHiPU</a>');
        done();
      });
    });

    it('returns embed code for a youtube normal url', function(done) {
      var youtube = { text: 'http://www.youtube.com/watch?v=5cazkHAHiPU', url: 'http://www.youtube.com/watch?v=5cazkHAHiPU' };
      webRemix.generate(youtube, client, function(err, subject) {
        subject.should.equal('<div class="object-wrapper"><iframe width="525" height="295" src="//www.youtube.com/embed/5cazkHAHiPU?wmode=transparent" ' +
          'frameborder="0" allowfullscreen></iframe></div><a href="http://www.youtube.com/watch?v=5cazkHAHiPU" target="_blank" class="media-off">http://www.youtube.com/watch?v=5cazkHAHiPU</a>');
        done();
      });
    });

    it('returns embed code for a vimeo video url', function(done) {
      var vimeo = { text: 'http://vimeo.com/37872583', url: 'http://vimeo.com/37872583' };
      webRemix.generate(vimeo, client, function(err, subject) {
        subject.should.equal('<div class="object-wrapper"><iframe src="//player.vimeo.com/video/37872583" width="525" height="295" ' +
          'frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe></div><a href="http://vimeo.com/37872583" target="_blank" class="media-off">http://vimeo.com/37872583</a>');
        done();
      });
    });

    it('returns oembed code for a soundcloud url', function(done) {
      var soundcloud = { text: 'http://soundcloud.com/skeptical/sets/tracks-576/', url: 'http://soundcloud.com/skeptical/sets/tracks-576/' };
      var scope = nock('soundcloud.com').get('/oembed?format=json&url=http//soundcloud.com/track').reply(200,
          { html: '<iframe src="//w.soundcloud.com/player/?url=http%3A' +
          '%2F%2Fapi.soundcloud.com%2Fplaylists%2F723408&amp;show_artwork=true" frameborder="no" height="450" ' +
          'scrolling="no" width="100%"></iframe><a class="media-link" target="_blank"' +
          'href="http://soundcloud.com/skeptical/sets/tracks-576/">http://soundcloud.com/skeptical/sets' +
          '/tracks-576/</a><a href="http://soundcloud.com/skeptical/sets/tracks-576/" target="_blank" class="media-off" ' +
          '>http://soundcloud.com/skeptical/sets/tracks-576/</a>' });
      webRemix.generate(soundcloud, client, function(err, subject) {
        subject.should.equal('<div class="object-wrapper"><iframe width="100%" height="450" scrolling="no" frameborder="no" ' +
          'src="//w.soundcloud.com/player/?url=http%3A%2F%2Fapi.soundcloud.com%2Fplaylists%2F723408&show_artwork=true">' +
          '</iframe></div><a href="http://soundcloud.com/skeptical/sets/tracks-576/" target="_blank" class="media-off"' +
          '>http://soundcloud.com/skeptical/sets/tracks-576/</a>');
        done();
      });
    });

    it('returns embed code for a rd.io short url', function(done) {
      var rdio = { text: 'http://rd.io/i/QVME9DdeW1GL', url: 'http://rd.io/i/QVME9DdeW1GL' };
      webRemix.generate(rdio, client, function(err, subject) {
        subject.should.equal('<div class="object-wrapper"><iframe class="rdio" width="450" height="80" ' +
          'src="//rd.io/i/QVME9DdeW1GL" frameborder="0"></iframe></div><a href="http://rd.io/i/QVME9DdeW1GL" target="_blank" class="media-off">http://rd.io/i/QVME9DdeW1GL</a>');
        done();
      });
    });

    it('returns embed code for a rdio normal url', function(done) {
      var rdio = { text: 'http://rdio.com/x/QVME9DdeW1GL', url: 'http://rdio.com/x/QVME9DdeW1GL' };
      webRemix.generate(rdio, client, function(err, subject) {
        subject.should.equal('<div class="object-wrapper"><iframe class="rdio" width="450" height="80" ' +
          'src="//rd.io/i/QVME9DdeW1GL" frameborder="0"></iframe></div><a href="http://rdio.com/x/QVME9DdeW1GL" target="_blank" class="media-off">http://rdio.com/x/QVME9DdeW1GL</a>');
        done();
      });
    });

    it('returns a regular link', function() {
      var link = { text: 'http://3.bp.blogspot.com/Riley+the+smiling+dog.jpg/test', url: 'http://3.bp.blogspot.com/Riley+the+smiling+dog.jpg/test' };
      webRemix.generate(link, client, function(err, subject) {
        subject.should.equal('<a href="http://3.bp.blogspot.com/Riley+the+smiling+dog.jpg/test" target="_blank" title="http://3.bp.blogspot.com/Riley+the+smiling+dog.jpg/test">http://3.bp.blogspot.com/Riley+the+smiling+dog.jpg/test</a>');
      });
    });

    it('returns image code for an instagr.am url', function(done) {
      var instagram = { text: 'http://instagram.com/p/QFJJzTw8yS/', url: 'http://instagram.com/p/QFJJzTw8yS/' };
      webRemix.generate(instagram, client, function(err, subject) {
        subject.should.equal('<div class="image-wrapper"><a href="http://instagram.com/p/QFJJzTw8yS/">' +
          '<img src="http://instagr.am/p/QFJJzTw8yS/media/"/></a></div><a href="http://instagram.com/p/QFJJzTw8yS/" target="_blank" class="media-off">http://instagram.com/p/QFJJzTw8yS/</a>');
        done();
      });
    });

    it('returns video for a video link', function(done) {
      var video = { text: 'http://blah.com/video.ogv', url: 'http://blah.com/video.ogv' };
      webRemix.generate(video, client, function(err, subject) {
        subject.should.equal('<div class="object-wrapper"><video controls="controls" preload="none" autobuffer><source src="http://blah.com/video.ogv' +
          '" type="video/ogg; codecs="vp8, vorbis" /></video></div><a href="http://blah.com/video.ogv" target="_blank" class="media-off">http://blah.com/video.ogv</a>');
        done();
      });
    });
  });
});
