'use strict';

define(['jquery'], function ($) {
  var messages = $('ol.messages');
  var currentFeed = '/my/feed';
  var sinceId = null;

  var MESSAGE_LIMIT = 19;
  var POLL_TIMEOUT = 30000;

  // Wait 30 seconds to get new data
  var pollMessages = function() {
    setTimeout(function() {
      setMessage(currentFeed, type, true);
    }, POLL_TIMEOUT);
  }

  var setMessage = function(url, type, data, isFragment) {
    if (type === 'GET') {
      currentFeed = url;
    }
    if (!isFragment) {
      messages.html('<li class="loading"><img src="/images/ajax-loader.gif"></li>');
    }
    $.ajax({
      url: url,
      type: type,
      data: data,
      dataType: 'json',
      cache: false

    }).done(function(data) {
      if (url !== '/add') {
          messages.empty();
      }
      for (var i = 0; i < data.messages.length; i ++) {
        var message = $('<li data-id=""><div class="meta"></div>' +
          '<a href="" class="who" title=""><img src=""></a><p></p></li>');
        message.find('.meta').html(data.messages[i].created_at);
        message.find('a.who').attr('title', data.messages[i].name);
        message.find('a.who img').attr('src', data.messages[i].user);
        message.find('p').html(data.messages[i].message);
        if (url !== '/add') {
          messages.append(message);
        } else {
          messages.prepend(message);
        }
      }

      sinceId = data.messages[data.messages.length - 1].id;

      if (!isFragment) {
        clearTimeout(pollMessages);
      }
      pollMessages = setTimeout(function() {
        setMessage(currentFeed, type, true);
      }, POLL_TIMEOUT);
    });
  };

  var self = {
    getMyFeed: function() {
      setMessage('/my/feed', 'GET', { since_id: sinceId }, false);
    },

    getMyPosts: function() {
      setMessage('/my/posts', 'GET', { since_id: sinceId }, false);
    },

    getGlobalFeed: function() {
      setMessage('/global/feed', 'GET', { since_id: sinceId }, false);
    },

    postMessage: function(form) {
      setMessage('/add', 'POST', form.serialize(), true);
    }
  };

  return self;
});
