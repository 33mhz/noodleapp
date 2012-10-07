/*global describe:true it:true */
'use strict';

var userDb = require('../lib/user');
var nock = require('nock');
var should = require('should');
var qs = require('querystring');
var redis = require('redis');
var client = redis.createClient();
var nconf = require('nconf');

nconf.argv().env().file({ file: 'test/local-test.json' });

describe('user', function() {
  describe('.star',  function() {
    it('stars a post', function(done) {
      userDb.star(1, 1, client);
      userDb.isStarred(1, 1, client, function(err, resp) {
        resp.should.be.true;
        done();
      });
    });

    it('unstars a post', function(done) {
      userDb.unstar(1, 1, client);
      userDb.isStarred(1, 1, client, function(err, resp) {
        resp.should.be.false;
        done();
      });
    });

    it('reposts a post', function(done) {
      userDb.repost(1, 1, client);
      userDb.isReposted(1, 1, client, function(err, resp) {
        resp.should.be.true;
        done();
      });
    });

    it('unreposts a post', function(done) {
      userDb.unrepost(1, 1, client);
      userDb.isReposted(1, 1, client, function(err, resp) {
        resp.should.be.false;
        done();
      });
    });

    it('adds a bff', function(done) {
      userDb.bffUser(1, 'test', client);
      userDb.bffs(1, client, function(err, resp) {
        resp[0].should.equal('test')
        done();
      });
    });

    it('removes a bff', function(done) {
      userDb.unbffUser(1, 'test', client);
      userDb.bffs(1, client, function(err, resp) {
        resp.should.be.empty;
        done();
      });
    });
  });
});
