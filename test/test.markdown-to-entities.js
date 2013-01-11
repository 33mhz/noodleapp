/*global describe:true it:true */
'use strict';

var markdownToEntities = require('../lib/markdown-to-entities');

describe('markdown-to-entities', function() {
  describe('parse', function() {
    it('returns correct text and entities', function(done) {
      var POST_TEXT = '@test After checking mail.app and generating id_rsa.pub, you can find #News at [The Washington Post](http://www.washingtonpost.com/), http://news.google.ca , [The New York Times](http://nytimes.com/), or www.bing.com/news/ .';
      var EXPECTED_RESULT = {
        text: '@test After checking mail.app and generating id_rsa.pub, you can find #News at The Washington Post, http://news.google.ca , The New York Times, or www.bing.com/news/ .',
        entities: {
          links: [
            {
              pos: 79,
              len: 19,
              url: 'http://www.washingtonpost.com/'
            },
            {
              pos: 100,
              len: 21,
              url: 'http://news.google.ca'
            },
            {
              pos: 124,
              len: 18,
              url: 'http://nytimes.com/'
            },
            {
              pos: 147,
              len: 18,
              url: 'http://www.bing.com/news/'
            }
          ]
        }
      };

      var result = markdownToEntities.parse(POST_TEXT);

      // Don't test the order, since it doesn't matter.
      result.entities.links.sort(function(a, b) {
        return a.pos - b.pos;
      });

      result.should.eql(EXPECTED_RESULT);
      done();
    });
  });

  describe('stringify', function() {
    it('returns correct markdown from text and links', function(done) {
      var USER_DESCRIPTION = {
        text: 'I\'m a chef at the Sabrosa restaurant [www.sabrosa.com].  Feel free to try some of our recipes [tastyrecipes.com].  In my spare time, I bike trails from http://trails.com/ and swim.',
        entities: {
          links: [
            {
              pos: 82,
              len: 11,
              amended_len: 30,
              text: 'our recipes',
              url: 'http://tastyrecipes.com/sabrosa'
            },
            {
              pos: 152,
              len: 18,
              text: 'http://trails.com/',
              url: 'http://trails.com/'
            },
            {
              pos: 18,
              len: 18,
              amended_len: 36,
              text: 'Sabrosa restaurant',
              url: 'http://www.sabrosa.com'
            }
          ]
        }
      };

      var EXPECTED_MARKDOWN = 'I\'m a chef at the [Sabrosa restaurant](http://www.sabrosa.com).  Feel free to try some of [our recipes](http://tastyrecipes.com/sabrosa).  In my spare time, I bike trails from http://trails.com/ and swim.';
      var result = markdownToEntities.stringify(USER_DESCRIPTION);
      result.should.eql(EXPECTED_MARKDOWN);
      done();
    });
  });
});
