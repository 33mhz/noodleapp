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

  appnet.getMyPosts();

  $('.my-posts').click(function() {
    $(this).siblings().removeClass('selected');
    $(this).addClass('selected');
    appnet.getMyPosts();
  });

  $('.my-feed').click(function() {
    $(this).siblings().removeClass('selected');
    $(this).addClass('selected');
    appnet.getMyFeed();
  });

  $('.global-feed').click(function() {
    $(this).siblings().removeClass('selected');
    $(this).addClass('selected');
    appnet.getGlobalFeed();
  });

  $('#write form').submit(function(ev) {
    ev.preventDefault();

    var self = $(this);
    appnet.postMessage(self);
    self.find('textarea').val('');
  })
});
