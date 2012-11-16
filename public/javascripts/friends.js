'use strict';

define(['jquery'],
  function ($) {

  var userLists = $('ol.suggestions');
  var usernamesArr = [];
  var write = $('.write');

  var self = {
    setBFFs: function() {
      $.ajax({
        url: '/my/bffs',
        type: 'GET',
        dataType: 'json',
        cache: false
      }).done(function(data) {
        for (var i = 0; i < data.usernames.length; i ++) {
          usernamesArr.push(data.usernames[i]);
        }
      });
    },

    getBFFs: function(self, cursorPosition) {
      var userList = self.closest('.write').find('ol.suggestions').empty();
      var beforeCursor = self.val().substring(0, cursorPosition);
      var userBeforeCursor;
      var userBeforeCursorMatch = beforeCursor.match(/@([A-Za-z0-9_]+)$/);

      if(userBeforeCursorMatch) {
        userBeforeCursor = userBeforeCursorMatch[1];

        // Usernames that start with what the user typed
        var selectedUsers = usernamesArr.filter(function(user) {
          return user.indexOf(userBeforeCursor) === 0;
        });

        // Redraw suggestions
        for (var j = 0; j < selectedUsers.length; j ++) {
          var userRow = $('<li></li>');
          userRow.text('@' + selectedUsers[j]);
          userList.append(userRow);
        }
      }
    },

    setUser: function(item, textarea, cursorPosition) {
      var textCount = 0;
      var fullLength = textarea.val().length;

      for (var i = cursorPosition - 1; i > -1; i --) {
        if (textarea.val()[i] !== '@') {
          textCount ++;
        } else {
          break;
        }
      }

      var fullText = textarea.val().substring(0, cursorPosition - textCount - 1) +
        item.text() + ' ' + textarea.val().substring(cursorPosition,
        fullLength + item.text().length + 1);

      textarea.focus();
      textarea.val(fullText);
      item.closest('write').find('.suggestions').empty();
    }
  };

  return self;
});
