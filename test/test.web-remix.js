/*global describe:true it:true */
'use strict';

var express = require('express');
var configurations = module.exports;
var app = express();
var server = require('http').createServer(app);
var webRemix = require('../lib/web-remix');
var nock = require('nock');
var should = require('should');
var qs = require('querystring');

describe('web-remix', function() {
  describe('.generate',  function() {
    it('returns embed code for a youtu.be short url', function() {
      var youtube = { text: 'http://youtu.be/5cazkHAHiPU', url: 'http://youtu.be/5cazkHAHiPU' };
      var subject = webRemix.generate(youtube);
      subject.should.equal('<div class="object-wrapper"><iframe width="525" height="295" src="//www.youtube.com/embed/5cazkHAHiPU?wmode=transparent" ' +
        'frameborder="0" allowfullscreen></iframe></div><a href="http://youtu.be/5cazkHAHiPU" target="_blank" class="media-off">http://youtu.be/5cazkHAHiPU</a>');
    });

    it('returns embed code for a youtube normal url', function() {
      var youtube = { text: 'http://www.youtube.com/watch?v=5cazkHAHiPU', url: 'http://www.youtube.com/watch?v=5cazkHAHiPU' };
      var subject = webRemix.generate(youtube);
      subject.should.equal('<div class="object-wrapper"><iframe width="525" height="295" src="//www.youtube.com/embed/5cazkHAHiPU?wmode=transparent" ' +
        'frameborder="0" allowfullscreen></iframe></div><a href="http://www.youtube.com/watch?v=5cazkHAHiPU" target="_blank" class="media-off">http://www.youtube.com/watch?v=5cazkHAHiPU</a>');
    });

    it('returns embed code for a vimeo video url', function() {
      var vimeo = { text: 'http://vimeo.com/37872583', url: 'http://vimeo.com/37872583' };
      var subject = webRemix.generate(vimeo);
      subject.should.equal('<div class="object-wrapper"><iframe src="//player.vimeo.com/video/37872583" width="525" height="295" ' +
        'frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe></div><a href="http://vimeo.com/37872583" target="_blank" class="media-off">http://vimeo.com/37872583</a>');
    });

    it('returns embed code for a rd.io short url', function() {
      var rdio = { text: 'http://rd.io/i/QVME9DdeW1GL', url: 'http://rd.io/i/QVME9DdeW1GL' };
      var subject = webRemix.generate(rdio);
      subject.should.equal('<div class="object-wrapper"><iframe class="rdio" width="450" height="80" ' +
        'src="//rd.io/i/QVME9DdeW1GL" frameborder="0"></iframe></div><a href="http://rd.io/i/QVME9DdeW1GL" target="_blank" class="media-off">http://rd.io/i/QVME9DdeW1GL</a>');
    });

    it('returns embed code for a rdio normal url', function() {
      var rdio = { text: 'http://rdio.com/x/QVME9DdeW1GL', url: 'http://rdio.com/x/QVME9DdeW1GL' };
      var subject = webRemix.generate(rdio);
      subject.should.equal('<div class="object-wrapper"><iframe class="rdio" width="450" height="80" ' +
        'src="//rd.io/i/QVME9DdeW1GL" frameborder="0"></iframe></div><a href="http://rdio.com/x/QVME9DdeW1GL" target="_blank" class="media-off">http://rdio.com/x/QVME9DdeW1GL</a>');
    });

    it('returns a regular link', function() {
      var link = { text: 'http://3.bp.blogspot.com/Riley+the+smiling+dog.jpg/test', url: 'http://3.bp.blogspot.com/Riley+the+smiling+dog.jpg/test' };
      var subject = webRemix.generate(link);
      subject.should.equal('<a href="http://3.bp.blogspot.com/Riley+the+smiling+dog.jpg/test" target="_blank">http://3.bp.blogspot.com/Riley+the+smiling+dog.jpg/test</a>');
    });

    it('returns image code for an instagr.am url', function() {
      var instagram = { text: 'http://instagram.com/p/QFJJzTw8yS/', url: 'http://instagram.com/p/QFJJzTw8yS/' };
      var subject = webRemix.generate(instagram);
      subject.should.equal('<div class="image-wrapper"><a href="http://instagram.com/p/QFJJzTw8yS/">' +
        '<img src="http://instagr.am/p/QFJJzTw8yS/media/"/></a></div><a href="http://instagram.com/p/QFJJzTw8yS/" target="_blank" class="media-off">http://instagram.com/p/QFJJzTw8yS/</a>');
    });
  });
});
