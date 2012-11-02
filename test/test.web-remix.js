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

    it('returns embed code for a mixcloud audio url', function() {
      var mixcloud = { text: 'http://mixcloud.com/LuckyMe/25-jamie-vexd-sunday-walkman-mix/', url: 'http://mixcloud.com/LuckyMe/25-jamie-vexd-sunday-walkman-mix/' };
      var scope = nock('mixcloud.com').get('/oembed?format=json&url=http//mixcloud.com/artist/track').reply(200,
          { html: '<div><object width="300" height="300"><param name="movie" value="//www.mixcloud.com/media/' +
          'swf/player/mixcloudLoader.swf?feed=http%3A%2F%2Fwww.mixcloud.com%2Flazykiki%2Fode-to-concrete%2F&amp;' +
          'embed_uuid=c40faa22-7805-46e6-9a5a-563b12de0f86&amp;stylecolor=&amp;embed_type=widget_standard">' +
          '</param><param name="allowFullScreen" value="true"></param><param name="wmode" value="opaque"></param>' +
          '<param name="allowscriptaccess" value="always"></param><embed src="//www.mixcloud.com/media/swf/player/' +
          'mixcloudLoader.swf?feed=http%3A%2F%2Fwww.mixcloud.com%2Flazykiki%2Fode-to-concrete%2F&amp;embed_uuid=' +
          'c40faa22-7805-46e6-9a5a-563b12de0f86&amp;stylecolor=&amp;embed_type=widget_standard" type="application/' +
          'x-shockwave-flash" wmode="opaque" allowscriptaccess="always" allowfullscreen="true" width="300" height="' +
          '300"></embed></object><div style="clear:both; height:3px;"></div><p style="display:block; font-size:12px; ' +
          'font-family:Helvetica, Arial, sans-serif; margin:0; padding: 3px 4px; color:#999;"><a href="http://www.' +
          'mixcloud.com/lazykiki/ode-to-concrete/?utm_source=widget&amp;amp;utm_medium=web&amp;amp;utm_campaign=base_' +
          'links&amp;amp;utm_term=resource_link" target="_blank" style="color:#02a0c7; font-weight:bold;">Ode to ' +
          'Concrète</a><span> by </span><a href="http://www.mixcloud.com/lazykiki/?utm_source=widget&amp;amp;utm_' +
          'medium=web&amp;amp;utm_campaign=base_links&amp;amp;utm_term=profile_link" target="_blank" style="' +
          'color:#02a0c7; font-weight:bold;">Lazy Kiki</a><span> on </span><a href="http://www.mixcloud.com/' +
          '?utm_source=widget&amp;utm_medium=web&amp;utm_campaign=base_links&amp;utm_term=homepage_link" ' +
          'target="_blank" style="color:#02a0c7; font-weight:bold;"> Mixcloud</a></p><div style="clear:both; ' +
          'height:3px;"></div></div><a href="http://mixcloud.com/LuckyMe/25-jamie-vexd-sunday-walkman-mix/" target="_blank" class="media-off" ' +
          '>http://mixcloud.com/LuckyMe/25-jamie-vexd-sunday-walkman-mix/</a>' });
      webRemix.generate(mixcloud, client, function(err, subject) {
        subject.should.equal('<div class="object-wrapper"><div class="object-wrapper"><div><object width="300" height="300"><param name="movie" ' +
          'value="//www.mixcloud.com/media/swf/player/mixcloudLoader.swf?feed=http%3A%2F%2Fwww.mixcloud.com%2F' +
          'lazykiki%2Fode-to-concrete%2F&amp;embed_uuid=2a3c7546-7bd1-482b-809c-0a0fa0f39095&amp;stylecolor=&amp;' +
          'embed_type=widget_standard"></param><param name="allowFullScreen" value="true"></param><param ' +
          'name="wmode" value="opaque"></param><param name="allowscriptaccess" value="always"></param>' +
          '<embed src="//www.mixcloud.com/media/swf/player/mixcloudLoader.swf?feed=http%3A%2F%2Fwww.mixcloud.com%2F' +
          'lazykiki%2Fode-to-concrete%2F&amp;embed_uuid=2a3c7546-7bd1-482b-809c-0a0fa0f39095&amp;stylecolor=&amp;embed_' +
          'type=widget_standard" type="application/x-shockwave-flash" wmode="opaque" allowscriptaccess="always" ' +
          'allowfullscreen="true" width="300" height="300"></embed></object><div style="clear:both; height:3px;">' +
          '</div><p style="display:block; font-size:12px; font-family:Helvetica, Arial, sans-serif; margin:0; ' +
          'padding: 3px 4px; color:#999;"><a href="http://www.mixcloud.com/lazykiki/ode-to-concrete/?utm_source=' +
          'widget&amp;amp;utm_medium=web&amp;amp;utm_campaign=base_links&amp;amp;utm_term=resource_link" ' +
          'target="_blank" style="color:#02a0c7; font-weight:bold;">Ode to Concrète</a><span> by </span>' +
          '<a href="http://www.mixcloud.com/lazykiki/?utm_source=widget&amp;amp;utm_medium=web&amp;amp;utm_' +
          'campaign=base_links&amp;amp;utm_term=profile_link" target="_blank" style="color:#02a0c7; ' +
          'font-weight:bold;">Lazy Kiki</a><span> on </span><a href="http://www.mixcloud.com/?utm_source=' +
          'widget&amp;utm_medium=web&amp;utm_campaign=base_links&amp;utm_term=homepage_link" target="_blank" ' +
          'style="color:#02a0c7; font-weight:bold;"> Mixcloud</a></p><div style="clear:both; height:3px;">' +
          '</div></div></div></div><a href="http://mixcloud.com/LuckyMe/25-jamie-vexd-sunday-walkman-mix/" target="_blank" class="media-off" ' +
          '>http://mixcloud.com/LuckyMe/25-jamie-vexd-sunday-walkman-mix/</a>');
      });
    });

    it('returns oembed code for a soundcloud url', function() {
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
          '</iframe></div><a href="http://soundcloud.com/skeptical/sets/tracks-576/" target="_blank" class="media-off" ' +
          '>http://soundcloud.com/skeptical/sets/tracks-576/</a>');
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

    it('returns image code for an instagr.am url', function() {
      var instagram = { text: 'http://instagram.com/p/QFJJzTw8yS/', url: 'http://instagram.com/p/QFJJzTw8yS/' };
      webRemix.generate(instagram, client, function(err, subject) {
        subject.should.equal('<div class="image-wrapper"><a href="http://instagram.com/p/QFJJzTw8yS/">' +
          '<img src="http://instagr.am/p/QFJJzTw8yS/media/"/></a></div><a href="http://instagram.com/p/QFJJzTw8yS/" target="_blank" class="media-off">http://instagram.com/p/QFJJzTw8yS/</a>');
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
