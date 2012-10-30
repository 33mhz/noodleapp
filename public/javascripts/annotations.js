'use strict';

define(['jquery'],
  function ($) {

  var self = {
    generateMoods: function(messageItem, message) {
      if (messageItem.moods.length > 0) {
        for (var i = 0; i < messageItem.moods.length; i ++) {
          var moodItem = messageItem.moods[i];
          if (moodArray.indexOf(moodItem) > -1) {
            var mood = $('<img src="" class="mood" alt="" title="">');
            mood
              .attr('src', '/images/emoticons/' + moodItem + '.png')
              .attr('alt', moodItem)
              .attr('title', moodItem);
            message.find('p').html(mood);
          }
        }
      }
    },

    generateImages: function(messageItem, message) {
      // Some clients include the url automatically which makes the image render twice for us.
      // So we won't render it if it already appears to be in the body of the text.
      if (messageItem.photos.length > 0) {
        for (var i = 0; i < messageItem.photos.length; i ++) {
          if (messageItem.text.indexOf(messageItem.photos[i].url) === -1) {
            var photo = '<div class="image-wrapper"><a href="' + messageItem.photos[i].embedUrl +
              '" target="_blank"><img src="' + messageItem.photos[i].url + '" alt="" title=""></div>' +
              '<a href="' + messageItem.photos[i].embedUrl + '" target="_blank" class="media-off">' +
              messageItem.photos[i].embedUrl + '</a>';
            message.find('p').append(photo);
          }
        }
      }
    }
  };

  return self;
});
