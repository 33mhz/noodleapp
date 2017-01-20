/*global describe:true it:true */
'use strict';

var markdownToEntities = require('../lib/markdown-to-entities');

describe('markdown-to-entities', function() {
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
