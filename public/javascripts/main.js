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
  var myMentions = $('.my-mentions');
  var globalFeed = $('.global-feed');
  var myFeed = $('.my-feed');

  myMentions.click(function() {
    var self = $(this);
    $(this).siblings().removeClass('selected');
    $(this).addClass('selected');
    appnet.getMentions();
  });

  myFeed.click(function() {
    var self = $(this);
    self.siblings().removeClass('selected');
    self.addClass('selected');
    appnet.getMyFeed();
  });

  globalFeed.click(function() {
    var self = $(this);
    self.siblings().removeClass('selected');
    self.addClass('selected');
    appnet.getGlobalFeed();
  });

  if (url === '/my/feed') {
    myFeed.click();
  } else if (url === '/global/feed') {
    globalFeed.click();
  } else {
    myMentions.click();
  }

  $('#write form').submit(function(ev) {
    ev.preventDefault();

    var self = $(this);
    appnet.postMessage(self);
    self.find('textarea').val('');
  })
});
