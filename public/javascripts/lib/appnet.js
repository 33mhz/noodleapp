'use strict';

define(['jquery'], function ($) {
  var messages = $('ol.messages');
  var currentFeed = '/my/feed';
  var myFeed = $('.my-feed');
  var sinceId = null;
  var isFragment = false;

  var MESSAGE_LIMIT = 19;
  var POLL_TIMEOUT = 10000;

  // Wait 1 minute to get new data
  var pollMessages = function() {
    setTimeout(function() {
      setMessage(currentFeed, type);
    }, POLL_TIMEOUT);
  }

  var setMessage = function(url, type) {
    currentFeed = url;

    if (!isFragment) {
      messages.html('<li class="loading"><img src="/images/ajax-loader.gif"></li>');
    }
    $.ajax({
      url: url,
      type: type,
      data: { since_id: sinceId },
      dataType: 'json',
      cache: false

    }).done(function(data) {
      if (!isFragment) {
        messages.empty();
      }

      if (data.messages.length > 0) {
        for (var i = 0; i < data.messages.length; i ++) {
          var message = $('<li><div class="meta">' +
            '<a href="" class="who" title=""><img src=""></a><div class="details">' +
            '<time></time><ol class="actions"><li class="thread"><span>Thread</span></li>' +
            '<li class="repost"><span>Repost</span></li>' +
            '<li class="like"><span>Like</span></li><li class="reply"><span>Reply</span>' +
            '</li></ol></div></div><p></p></li>');
          message.find('time').html(data.messages[i].created_at);
          message.find('a.who')
            .attr('title', data.messages[i].name)
            .attr('href', '/user/' + data.messages[i].username);
          message.find('a.who img').attr('src', data.messages[i].user);
          message.find('p').html(data.messages[i].message);

          messages.prepend(message);
        }

        messages.find('> li:gt(' + MESSAGE_LIMIT + ')').remove();
        sinceId = data.messages[data.messages.length - 1].id;
      }

      if (!isFragment) {
        clearTimeout(pollMessages);
      }

      isFragment = true;

      pollMessages = setTimeout(function() {
        setMessage(currentFeed, type);
      }, POLL_TIMEOUT);
    });
  };

  var self = {
    getMyFeed: function() {
      isFragment = false;
      sinceId = null;
      setMessage('/my/feed', 'GET');
    },

    getUserPosts: function() {
      isFragment = false;
      sinceId = null;
      setMessage('/user/posts/' + messages.data('userid'), 'GET');
    },

    getUserMentions: function() {
      isFragment = false;
      sinceId = null;
      setMessage('/user/mentions/' + messages.data('userid'), 'GET');
    },

    getUserStarred: function() {
      isFragment = false;
      sinceId = null;
      setMessage('/user/starred/' + messages.data('userid'), 'GET');
    },

    getGlobalFeed: function() {
      isFragment = false;
      sinceId = null;
      setMessage('/global/feed', 'GET');
    },

    postMessage: function(form) {
      isFragment = true;
      $.ajax({
        url: '/add',
        type: 'POST',
        data: form.serialize(),
        dataType: 'json',
        cache: false

      }).done(function(data) {
        sinceId = null;
        myFeed.click();
      });
    }
  };

  return self;
});
