'use strict';

define(['jquery'], function ($) {
  var messages = $('ol.messages');

  var setMessage = function(url, type) {
    $.ajax({
      url: url,
      type: type,
      dataType: 'json'

    }).done(function(data) {
      messages.html('');
      for (var i = 0; i < data.messages.length; i ++) {
        var message = $('<li><div class="meta"></div><p></p></li>');
        message.find('.meta').html(data.messages[i].created_at);
        message.find('p').html(data.messages[i].message);
        messages.append(message);
      }
    });
  };

  var self = {
    getMyFeed: function() {
      setMessage('/my/feed', 'GET');
    },

    getMyPosts: function() {
      setMessage('/my/posts', 'GET');
    },

    getGlobalFeed: function() {
      setMessage('/global/feed', 'GET');
    }
  };

  return self;
});
