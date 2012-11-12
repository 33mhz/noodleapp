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
