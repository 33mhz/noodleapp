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

    getBFFs: function(self, usernameClip) {
      var tokenized = usernameClip.split(/\s/);
      var lastUser = tokenized[tokenized.length - 1];
      var userList = self.closest('.write').find('ol.suggestions');

      if (lastUser.length < 2) {
        userList.empty();
      } else if(lastUser.match(/@[A-Za-z0-9_-]+/gi)) {
        lastUser = lastUser.split('@')[1];

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

    setUser: function(item, currWrite) {
      var textarea = currWrite.find('textarea');
      var tokenized = textarea.val().split(/\s/);
      var lastChars = tokenized[tokenized.length - 1].length;

      textarea.focus();
      textarea.val(textarea.val().substring(0, textarea.val().length - lastChars) + item.text() + ' ');
      item.closest('write').find('.suggestions').empty();
    }
  };

  return self;
});
