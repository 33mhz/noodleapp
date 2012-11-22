/*global describe:true it:true */
'use strict';

var appnet = require('../lib/appnet');
var nock = require('nock');
var should = require('should');
var qs = require('querystring');
var redis = require('redis');
var client = redis.createClient();
var nconf = require('nconf');

nconf.argv().env().file({ file: 'test/local-test.json' });

var APPNET_URL = 'https://alpha-api.app.net';

var USER_JSON = {
    "data": {
        "id": "1",
        "username": "mthurman",
        "name": "Mark Thurman",
        "description": {
           "text": "Hi, I'm Mark Thurman and I'm teaching you about the @appdotnet Stream #API.",
           "html": "Hi, I'm Mark Thurman and I'm <a href=\"https://github.com/appdotnet/api_spec\" rel=\"nofollow\">teaching you</a> about the <span itemprop=\"mention\" data-mention-name=\"appdotnet\" data-mention-id=\"3\">@appdotnet</span> Stream #<span itemprop=\"hashtag\" data-hashtag-name=\"api\">API</span>.",
           "entities": {
               "mentions": [{
                   "name": "appdotnet",
                   "id": "3",
                   "pos": 52,
                   "len": 10
               }],
               "hashtags": [{
                   "name": "api",
                   "pos": 70,
                   "len": 4
               }],
               "links": [{
                   "text": "teaching you",
                   "url": "https://github.com/appdotnet/api-spec",
                   "pos": 29,
                   "len": 12
               }]
            }
        },
        "timezone": "US/Pacific",
        "locale": "en_US",
        "avatar_image": {
            "height": 512,
            "width": 512,
            "url": "https://example.com/avatar_image.jpg"
        },
        "cover_image": {
            "height": 118,
            "width": 320,
            "url": "https://example.com/cover_image.jpg"
        },
        "type": "human",
        "created_at": "2012-07-16T17:23:34Z",
        "counts": {
            "following": 100,
            "followers": 200,
            "posts": 24,
            "stars": 76
        },
        "app_data": {},
        "follows_you": false,
        "you_follow": true,
        "you_muted": false,
        "access_token": 1
    },
    "meta": {
        "code": 200
    }
};
var POST_JSON = {
    "data": [
        {
            "id": "1",
            "user": {},
            "created_at": "2012-07-16T17:25:47Z",
            "text": "@berg FIRST post on this new site #newsocialnetwork",
            "html": "<span itemprop=\"mention\" data-mention-name=\"berg\" data-mention-id=\"2\">@berg</span> FIRST post on <a href=\"https://join.app.net\" rel=\"nofollow\">this new site</a> <span itemprop=\"hashtag\" data-hashtag-name=\"newsocialnetwork\">#newsocialnetwork</span>.",
            "source": {
                "client_id": "udxGzAVBdXwGtkHmvswR5MbMEeVnq6n4",
                "name": "Clientastic for iOS",
                "link": "http://app.net"
            },
            "machine_only": false,
            "reply_to": null,
            "thread_id": "1",
            "num_replies": 3,
            "num_reposts": 0,
            "num_stars": 0,
            "entities": {
                "mentions": [{
                    "name": "berg",
                    "id": "2",
                    "pos": 0,
                    "len": 5
                }],
                "hashtags": [{
                    "name": "newsocialnetwork",
                    "pos": 34,
                    "len": 17
                }],
                "links": [{
                    "text": "this new site",
                    "url": "https://join.app.net",
                    "pos": 20,
                    "len": 13
                }]
            },
            "you_reposted": false,
            "you_starred": false
        },
    ],
    "meta": {
        "code": 200,
        "max_id": "47",
        "min_id": "1",
        "more": true
    }
};

POST_JSON.data.user = USER_JSON.data;

var req = {
  session: {
    passport: {
      user: {}
    },
    url: null
  },
  params: {
    id: 1,
    username: 'test'
  },
  query: {
    since_id: 1,
    before_id: 1
  },
  body: {
    text: 'test',
    message: 'test',
    reply_to: 1
  }
};

req.session.passport.user = USER_JSON.data;

var userId = USER_JSON.data.id;

describe('appnet', function() {
  describe('.userPosts',  function() {
    it('returns posts by a user', function(done) {
      var scope = nock(APPNET_URL)
        .get('/stream/0/users/1/posts?access_token=1&since_id=1&before_id=1&include_deleted=0&include_annotations=1')
        .reply(200, POST_JSON);
      appnet.userPosts(req, client, function(err, resp) {
        resp.data[0].id.should.equal('1');
        done();
      });
    });

    it('returns a user', function(done) {
      var scope = nock(APPNET_URL)
        .get('/stream/0/users/@test?access_token=1')
        .reply(200, USER_JSON);
      appnet.getUser(req, req.params.username, function(err, resp) {
        resp.data.id.should.equal('1');
        done();
      });
    });

    it('returns my feed', function(done) {
      var scope = nock(APPNET_URL)
        .get('/stream/0/posts/stream?access_token=1&since_id=1&before_id=1&include_deleted=0&include_directed_posts=0&include_annotations=1')
        .reply(200, POST_JSON);
      appnet.myFeed(req, client, function(err, resp) {
        resp.data[0].id.should.equal('1');
        done();
      });
    });

    it('returns user mentions', function(done) {
      var scope = nock(APPNET_URL)
        .get('/stream/0/users/1/mentions?access_token=1&since_id=1&before_id=1&include_deleted=0&count=&include_annotations=1')
        .reply(200, POST_JSON);
      appnet.userMentions(req, function(err, resp) {
        resp.data[0].id.should.equal('1');
        done();
      });
    });

    it('returns user starred', function(done) {
      var scope = nock(APPNET_URL)
        .get('/stream/0/users/1/stars?access_token=1&before_id=1&include_deleted=0&include_annotations=1')
        .reply(200, POST_JSON);
      appnet.userStarred(req, client, function(err, resp) {
        resp.data[0].id.should.equal('1');
        done();
      });
    });

    it('returns the global feed', function(done) {
      var scope = nock(APPNET_URL)
        .get('/stream/0/posts/stream/global?access_token=1&since_id=1&before_id=1&include_deleted=0&include_annotations=1')
        .reply(200, POST_JSON);
      appnet.globalFeed(req, function(err, resp) {
        resp.data[0].id.should.equal('1');
        done();
      });
    });

    it('returns a paginated global feed', function(done) {
      req.session.url = '/global/feed';
      var scope = nock(APPNET_URL)
        .get('/stream/0/posts/stream/global?access_token=1&since_id=&before_id=1&include_deleted=0&include_annotations=1')
        .reply(200, POST_JSON);
      appnet.paginatedFeed(req, client, function(err, resp) {
        resp.data[0].id.should.equal('1');
        done();
      });
    });

    it('returns paginated user posts', function(done) {
      req.session.url = '/user/posts';
      var scope = nock(APPNET_URL)
        .get('/stream/0/users/1/posts?access_token=1&since_id=&before_id=1&include_deleted=0&include_annotations=1')
        .reply(200, POST_JSON);
      appnet.paginatedFeed(req, client, function(err, resp) {
        resp.data[0].id.should.equal('1');
        done();
      });
    });

    it('returns paginated user mentions', function(done) {
      req.session.url = '/user/mentions';
      var scope = nock(APPNET_URL)
        .get('/stream/0/users/1/mentions?access_token=1&since_id=&before_id=1&include_deleted=0&count=&include_annotations=1')
        .reply(200, POST_JSON);
      appnet.paginatedFeed(req, client, function(err, resp) {
        resp.data[0].id.should.equal('1');
        done();
      });
    });

    it('returns paginated user starred posts', function(done) {
      req.session.url = '/user/starred';
      var scope = nock(APPNET_URL)
        .get('/stream/0/users/1/stars?access_token=1&before_id=1&include_deleted=0&include_annotations=1')
        .reply(200, POST_JSON);
      appnet.paginatedFeed(req, client, function(err, resp) {
        resp.data[0].id.should.equal('1');
        done();
      });
    });

    it('returns paginated my feed', function(done) {
      req.session.url = '/my/feed';
      var scope = nock(APPNET_URL)
        .get('/stream/0/posts/stream?access_token=1&since_id=&before_id=1&include_deleted=0&include_directed_posts=0&include_annotations=1')
        .reply(200, POST_JSON);
      appnet.paginatedFeed(req, client, function(err, resp) {
        resp.data[0].id.should.equal('1');
        done();
      });
    });

    it('returns a created post', function(done) {
      var params = {
        text: 'test',
        entities: {
          links: []
        },
        reply_to: 1
      };
      var scope = nock(APPNET_URL)
        .post('/stream/0/posts?access_token=1&include_annotations=1', JSON.stringify(params))
        .reply(200, POST_JSON);
      appnet.addMessage(req, client, function(err, resp) {
        resp.data[0].id.should.equal('1');
        done();
      });
    });

    it('returns a deleted post', function(done) {
      req.body.post_id = 1;
      var scope = nock(APPNET_URL)
        .delete('/stream/0/posts/1?access_token=1')
        .reply(200, POST_JSON);
      appnet.deleteMessage(req, client, function(err, resp) {
        resp.data[0].id.should.equal('1');
        done();
      });
    });
  });
});
