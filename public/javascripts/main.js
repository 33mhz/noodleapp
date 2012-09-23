'use strict';

requirejs.config({
  baseUrl: '/javascripts/lib',
  enforceDefine: true,
  paths: {
    jquery: 'https://ajax.googleapis.com/ajax/libs/jquery/1.8.0/jquery.min'
  }
});

define(['jquery', 'appnet'],
  function($, appnet) {

  var url = $('body').data('url');
  var userMentions = $('.user-mentions');
  var globalFeed = $('.global-feed');
  var userPosts = $('.user-posts');
  var userStarred = $('.user-starred');
  var myFeed = $('.my-feed');
  var resetTab = function(self, callback) {
    self.siblings().removeClass('selected');
    self.addClass('selected');
    callback();
  };

  myFeed.click(function() {
    var self = $(this);
    resetTab(self, function() {
      appnet.getMyFeed();
    });
  });

  globalFeed.click(function() {
    var self = $(this);
    resetTab(self, function() {
      appnet.getGlobalFeed();
    });
  });

  userPosts.click(function() {
    var self = $(this);
    resetTab(self, function() {
      appnet.getUserPosts();
    });
  });

  userMentions.click(function() {
    var self = $(this);
    resetTab(self, function() {
      appnet.getUserMentions();
    });
  });

  userStarred.click(function() {
    var self = $(this);
    resetTab(self, function() {
      appnet.getUserStarred();
    });
  });

  if (url === '/global/feed') {
    globalFeed.click();
  } else if (url.match(/\/user\/posts/)) {
    userPosts.click();
  } else if (url.match(/\/user\/mentions/)) {
    userMentions.click();
  } else if (url.match(/\/user\/starred/)) {
    userStarred.click();
  } else {
    // Defaults to my feed
    myFeed.click();
  }

  $('#write form').submit(function(ev) {
    ev.preventDefault();

    var self = $(this);
    appnet.postMessage(self);
    url = '/my/feed';
    self.find('textarea').val('');
    return false;
  })
});
