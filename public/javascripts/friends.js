'use strict';

define(['jquery'],
  function ($) {

  var userLists = $('ol.suggestions');
  var usernamesArr = [];
  var selectedUsers = {};
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
      var usernameClip = '';
      var userList = self.closest('.write').find('ol.suggestions');

      for (var i = cursorPosition - 1; i > -1; i --) {
        if (self.val()[i] !== '@') {
          usernameClip += self.val()[i];
        } else {
          usernameClip += '@';
          break;
        }
      }

      usernameClip = usernameClip.split('').reverse().join('');

      if (!usernameClip.match(/^@/)) {
        userList.empty();
      } else if(usernameClip.match(/@[A-Za-z0-9_-]+/gi)) {
        var lastUser = usernameClip.split('@')[1];

        // Add a username if it has a wildcard match
        for (var i = 0; i < usernamesArr.length; i ++) {
          if (usernamesArr[i].indexOf(lastUser) === 0) {
            selectedUsers[usernamesArr[i]] = usernamesArr[i];
          } else {
            delete selectedUsers[usernamesArr[i]];
          }
        }

        userList.empty();
        // Redraw suggestions
        for (var i in selectedUsers) {
          var userRow = $('<li></li>');
          userRow.text('@' + selectedUsers[i]);
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
