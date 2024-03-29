requirejs.config({
  baseUrl: '/javascripts/',
  enforceDefine: true,
  paths: {
    jquery: '/javascripts/jquery'
  }
});

define(['jquery', 'pnut', 'friends', 'jquery.caret'],
  function($, pnut, friends, user) {
  'use strict';

  var body = $('body');
  var url = body.data('url');
  var tabs = body.find('.tabs');
  var messages = body.find('ol.messages');
  var write = body.find('.write form');
  var userInfo = body.find('.user-info');
  var overlay = body.find('#overlay');
  var charLimit = body.find('.counter');
  var suggestions = body.find('ol.suggestions');
  var notifications = body.find('#notifications-preview');
  var notificationIcon = body.find('#notifications');
  var mapMenu = body.find('#map-menu');
  var primaryWrite = body.find('#write');
  var dashboard = body.find('.dashboard-content');
  var unreadMessages = $('#unread-messages');
  var unreadMessagesNest = unreadMessages.find('ol');
  var win = $(window);
  var doc = $(document);
  var csrf = write.find('input[name="_csrf"]').val();
  var postLoad = false;
  var notificationsDisplay = false;
  var menuOpen = false;
  var currentMessage;

  var CHAR_MAX = parseInt(body.data('charlimit'), 10);

  var TAB_KEYCODE = 9;
  var RETURN_KEYCODE = 13;
  var ESCAPE_KEYCODE = 27;
  var SPACE_KEYCODE = 32;
  var D_KEYCODE = 68;
  var F_KEYCODE = 70;
  var J_KEYCODE = 74;
  var K_KEYCODE = 75;
  var P_KEYCODE = 80;
  var Q_KEYCODE = 81;
  var R_KEYCODE = 82;
  var S_KEYCODE = 83;
  var T_KEYCODE = 84;
  var U_KEYCODE = 85;
  var N_KEYCODE = 78;
  var QUESTION_SLASH_KEYCODE = 191;

  var MESSAGE_LIMIT = 99;

  overlay.on('click', '.settings-toggle', function(ev) {
    ev.preventDefault();
    var self = $(this);
    self.toggleClass('on');
    self.find('input').val(self.hasClass('on'));
  });

  var resetNotificationDisplay = function() {
    notificationIcon
      .removeClass('on')
      .text(0);
    document.title = 'NoodleApp';
    pnut.resetUnread();
  };

  var showUnread = function(unreadMessages) {
    clearUnread(unreadMessages);
    resetNotificationDisplay();
    if (messages.find('> li').length >= 20 && messages.find('#paginated').length === 0) {
      messages.append('<li id="paginated">View Older</li>');
    }
  };

  var resetTab = function(self, callback) {
    self.siblings().removeClass('selected');
    self.addClass('selected');
    callback();
  };

  var checkUrl = function() {
    var hash = document.location.hash;

    if (hash.indexOf('/post/') > -1) {
      var postArray = hash.split('/post/')[1].split('/');
      var postId = postArray[0];
      pnut.showPost(postId);
      body.addClass('fixed');
    } else if (hash.indexOf('/tagged/') > -1) {
      pnut.showTagged(hash.split('/tagged/')[1]);
      body.addClass('fixed');
    } else if (hash.length < 3 && body.hasClass('fixed')) {
       closeOverlay();
    }
  };

  // Length of actual text that will be posted to pnut.io
  var getEffectiveLength = function(text) {
    // Same as in markdown-to-entities, but global
    var markdownLinkRegex = /\[([^\]]+)\]\((\S+(?=\)))\)/g;

    // Apparently newlines are considered part of the character count limitation
    // And apparently the newline is treated as two characters, not one when passed
    // to the API as a post message - so here we count one for the key enter and one for
    // the newline regex match. Which results in working out as two: '\n'
    var markdownText = text.replace(markdownLinkRegex, '$1');
    var markdownTextNewlineCount = 0;
    if (markdownText.match(/\n/g)) {
      markdownTextNewlineCount = markdownText.match(/\n/g).length;
    }

    return markdownText.length + markdownTextNewlineCount;
  };

  var checkCharLimit = function(text) {
    var textLength = getEffectiveLength(text);
    var button = write.find('button');

    if (textLength > CHAR_MAX) {
      charLimit.addClass('over');
      charLimit.text('- ' + (textLength - CHAR_MAX));
      button.attr('disabled', 'disabled');
      button.addClass('disabled');
    } else {
      charLimit.removeClass('over');
      charLimit.text(CHAR_MAX - textLength);
      button.removeAttr('disabled');
      button.removeClass('disabled');
    }
  };

  var updateFeed = function(self, callback) {
    messages.empty();
    resetTab(self, function() {
      callback();
    });
  };

  var closeOverlay = function() {
    window.history.pushState('', '', document.location.href.split('#')[0]);
    overlay.find('.inner-overlay').html('');
    overlay.find('textarea').val('');
    overlay.slideUp(function() {
      body.removeClass('fixed');
      overlay.removeClass('settings-overlay');
    });
  };

  var clearUnread = function(self) {
    messages.prepend(unreadMessagesNest.find('li.message-item'));
    unreadMessages.find('h2').empty();
    unreadMessages.find('ol').empty();
    pnut.setUnreadMessageCount();
    self.fadeOut();
    messages.find('> li:gt(' + MESSAGE_LIMIT + ')').remove();
  };

  var showSettings = function() {
    $.get('/settings', function(data) {
      body.addClass('fixed');
      menuOpen = true;
      overlay.find('.write').hide();
      overlay.addClass('settings-overlay');
      overlay.find('.inner-overlay').html(data);
      overlay.slideDown();
    });
  };

  /* Feed functionality */
  tabs.on('click', function(ev) {
    var self = $(ev.target);

    if (!self.hasClass('initial')) {
      closeOverlay();
    }

    self.removeClass('initial');

    tabs.find('a').removeClass('selected');
    self.addClass('selected');

    switch (self.data('action')) {
      case 'global-feed':
        updateFeed(self, function() {
          pnut.getGlobalFeed();
        });
        break;

      case 'user-posts':
        updateFeed(self, function() {
          pnut.getUserPosts();
        });
        break;

      case 'user-mentions':
        updateFeed(self, function() {
          pnut.getUserMentions();
        });
        break;

      case 'user-interactions':
        updateFeed(self, function() {
          pnut.getUserInteractions();
        });
        break;

      case 'user-starred':
        updateFeed(self, function() {
          pnut.getUserStarred();
        });
        break;

      case 'my-feed':
        updateFeed(self, function() {
          pnut.getMyFeed();
        });
        break;
    }
  });

  /* Automatic feed loader */
  tabs.find('a.selected').click();

  /* Message functionality */
  messages.on('click', function(ev) {
    var self = $(ev.target);

    switch (self.data('action')) {
      case 'quote':
        var textarea = self.closest('.dashboard-content').find('textarea');
        textarea.focus();
        write.find('.form-action-wrapper').slideDown('fast');
        textarea.val(' >> ' + self.closest('.message-item').data('original'));
        break;

      case 'delete':
        pnut.deleteMessage(self.closest('.message-item').data('id'), csrf);
        self.closest('li.message-item').fadeOut();
        break;

      case 'thread':
        pnut.showThread(self.closest('.message-item').data('id'));
        body.addClass('fixed');
        break;

      case 'paginated':
        pnut.getOlderPosts(self.prev().data('id'));
        break;
    }
  });

  var windowHasScrolled = false;
  var scollCheck = setInterval(function () {
    if (windowHasScrolled) {
      var nearBottom = win.scrollTop() > doc.height() - win.height() - 200;
      if (nearBottom) {
        $('#paginated').click();
      }
    }
    windowHasScrolled = false;
  }, 100);

  win.on('scroll', function () {
    windowHasScrolled = true;
  });

  // Overlay functionality
  overlay.on('click', function(ev) {
    var self = $(ev.target);
    var selfLink = self.parent();

    switch (self.data('action')) {
      case 'reply':
        var messageItem = self.closest('.message-item');
        var mentions = (messageItem.data('mentions') !== '') ? messageItem.data('mentions') + ' ' : '';

        overlay.find('textarea')
          .focus()
          .val('@' + messageItem.data('username') + ' ' + mentions);

        if (parseInt(messageItem.data('replyto'), 10) > 0) {
          overlay.find('.reply_to').val(messageItem.data('replyto'));

        } else {
         overlay.find('.reply_to').val(messageItem.data('id'));
        }
        break;

      case 'thread':
        pnut.showThread(self.closest('.message-item').data('id'));
        body.addClass('fixed');
        break;

      case 'close':
        closeOverlay();
        break;

      case 'quote':
        var messageItem = self.closest('.message-item');

        overlay.find('textarea')
          .focus()
          .val(' >> ' + self.closest('.message-item').data('original'));

        if (parseInt(messageItem.data('replyto'), 10) > 0) {
          overlay.find('.reply_to').val(messageItem.data('replyto'));

        } else {
         overlay.find('.reply_to').val(messageItem.data('id'));
        }
        break;
    }
  });

  // General activity for all shared functionality
  body.on('click', function(ev) {
    var self = $(ev.target);
    var selfLink = self.parent();

    if (!self.hasClass('writeable')) {
      suggestions.empty();
    }

    if (notificationsDisplay &&
      !(self.is('#notifications-preview') ||
      self.is('#notifications') ||
      self.closest('#notifications-preview').length)) {

      notifications.slideUp();
      notificationsDisplay = false;
    }

    switch (true) {
      case self.hasClass('new-pm'):
        $('#message-detail').html('');
        $('#message-summary').find('a.selected').removeClass('selected');
        $('#destination').val('');
        $('#channel-id').val('');
        $('#destination').focus();
        break;
      case self.hasClass('writers'):
        self = self.parent('.channel');
      case self.hasClass('channel'):
        pnut.getMessages(self.data('id'));
        self.closest('#message-summary').find('a.selected').removeClass('selected');
        // if (self.data('username').toLowerCase !== '@' + body.data('username').toLowerCase) {
          // write.find('#destination').val(self.data('username'));
        // } else {
        write.find('#destination').val('');
        // }
        write.find('#channel-id').val(self.data('id'));
        self.addClass('selected');
        break;
      case selfLink.hasClass('channel'):
        pnut.getMessages(selfLink.data('id'));
        selfLink.closest('#message-summary').find('a.selected').removeClass('selected');
        write.find('#destination').val('');
        write.find('#channel-id').val(selfLink.data('id'));
        selfLink.addClass('selected');
        break;
      case (self.hasClass('reply')):
        self.closest('.message-item').find('time').click();
        break;

      case self.hasClass('close'):
        write.find('textarea').val('');
        write.find('textarea').blur();
        break;

      case self.hasClass('star'):
        if (self.hasClass('on')) {
          self.removeClass('on');
          self.find('span').text('Star');
          pnut.unstarMessage(self.closest('.message-item').data('id'), csrf);
        } else {
          self.addClass('on');
          self.find('span').text('Unstar');
          pnut.starMessage(self.closest('.message-item').data('id'), csrf);
        }
        break;

      case self.hasClass('repost'):
        if (self.hasClass('on')) {
          self.removeClass('on');
          self.find('span').text('Repost');
          pnut.unrepostMessage(self.closest('.message-item').data('id'), csrf);
        } else {
          self.addClass('on');
          self.find('span').text('Unrepost');
          pnut.repostMessage(self.closest('.message-item').data('id'), csrf);
        }
        break;

      case self.is('time'):
        var textarea = overlay.find('textarea');
        var closest = self.closest('.message-item');
        var postId = closest.data('id');

        if (parseInt(closest.data('repostid'), 10) > 0) {
          postId = closest.data('repostid');
        }

        document.location.hash = '/post/' + postId +
          '/' + closest.data('username');
        break;

      case self.is('#notifications'):
        resetNotificationDisplay();

        if (!notificationsDisplay) {
          notifications.slideDown();
          notificationsDisplay = true;

        } else {
          notifications.slideUp();
          notificationsDisplay = false;
        }
        break;

      case self.hasClass('tags'):
        ev.preventDefault();
        document.location.hash = self.attr('href');
        break;

      case self.is('#settings-link'):
        showSettings();
        break;

      case self.parent().is('#unread-messages'):
        showUnread(self.parent());
        break;

      case self.is('#menu-toggle'):
        if (!menuOpen) {
          menuOpen = true;
          mapMenu
            .removeClass('off')
            .addClass('on');
        } else {
          menuOpen = false;
          mapMenu
            .removeClass('on')
            .addClass('off');
        }
        break;
    }
  });

  var keyCodeToClassName = {};
  keyCodeToClassName[D_KEYCODE] = '.delete';
  keyCodeToClassName[T_KEYCODE] = '.thread';
  keyCodeToClassName[S_KEYCODE] = '.star';
  keyCodeToClassName[R_KEYCODE] = '.reply';
  keyCodeToClassName[P_KEYCODE] = '.repost';
  keyCodeToClassName[Q_KEYCODE] = '.quote';

  body.on('keydown', function(ev) {
    var self = $(ev.target);

    // Close all overlays and menus if ESC is pressed
    if (ev.keyCode === ESCAPE_KEYCODE && (body.hasClass('fixed') || menuOpen)) {
      closeOverlay();
      if (mapMenu.hasClass('on')) {
        mapMenu
          .removeClass('on')
          .addClass('off');
        menuOpen = false;
      }
      body.focus();
    }

    // Open menu if ctrl|cmd|shift + ?|/ is pressed
    if (ev.keyCode === QUESTION_SLASH_KEYCODE &&
      (ev.ctrlKey || ev.metaKey || ev.shiftKey) &&
      !write.find('textarea').hasClass('on')) {
      mapMenu.find('#menu-toggle').click();
    }

    // Create a new post
    if (ev.keyCode === N_KEYCODE && !write.find('textarea').hasClass('on') &&
      !write.hasClass('channel-message-form')) {
      ev.preventDefault();
      dashboard.find('.write textarea').focus();
    }

    if (self.hasClass('submittable')) {
      if (ev.keyCode === TAB_KEYCODE || ev.keyCode === SPACE_KEYCODE) {
        // Pressing TAB/space autocompletes to the first user listed.
        var userLi = suggestions.find('li:first');
        if (userLi.length) {
          friends.setUser(userLi, self, self.getCursorPosition());
          suggestions.empty();
          return false;
        }

      } else if (ev.keyCode === RETURN_KEYCODE && (ev.ctrlKey || ev.metaKey) &&
        !write.find('button').hasClass('disabled')) {
        self.closest('form').submit();
      }
    }

    if (!(self.is('textarea') || self.is('input') || ev.ctrlKey || ev.shiftKey || ev.metaKey)) {
      if (ev.keyCode === K_KEYCODE || ev.keyCode === J_KEYCODE) {
        currentMessage = body.find('.message-item.selected-item');
        if (!currentMessage.length) {
          currentMessage = body.find('.message-item:visible:first');
          currentMessage.addClass('selected-item');
          currentMessage.focus();
          return;
        }

        var next;
        if (ev.keyCode === K_KEYCODE) {
          next = currentMessage.prev('.message-item');
          if(next.length === 0) {
            var unreadMessages = $('#unread-messages');
            if(unreadMessages.is(':visible')) {
              showUnread(unreadMessages);
              next = currentMessage.prev('.message-item');
            }
          }
        } else {
          next = currentMessage.next('.message-item');
        }

        if (next.length) {
          currentMessage.removeClass('selected-item');
          next.addClass('selected-item');
          $(window).scrollTop(next.position().top - 40);
          next.focus();
          currentMessage = next;
        }
        ev.preventDefault();
      }

      if (currentMessage) {
        if (ev.keyCode == F_KEYCODE || ev.keyCode == U_KEYCODE) {
          var username = currentMessage.data('username');
          if (ev.keyCode == F_KEYCODE) {
            pnut.follow(username, csrf, true);
          } else {
            pnut.unfollow(username, csrf, true);
          }
          ev.preventDefault();
        } else if(keyCodeToClassName[ev.keyCode]) {
          currentMessage.find(keyCodeToClassName[ev.keyCode]).click();
          ev.preventDefault();
        }
      }
    }
  });

  /* User functionality */
  userInfo.on('click', function(ev) {
    var self = $(ev.target);

    switch (true) {
      case self.hasClass('followers'):
        pnut.showFollowers();
        body.addClass('fixed');
        break;

      case self.hasClass('following'):
        pnut.showFollowing();
        body.addClass('fixed');
        break;

      case self.hasClass('follow'):
        if (self.hasClass('on')) {
          self.removeClass('on');
          self.text('Follow');
          pnut.unfollow(self.parent().data('username'), csrf, false);

        } else {
          self.addClass('on');
          self.text('Unfollow');
          pnut.follow(self.parent().data('username'), csrf, false);
        }
        break;

      case self.hasClass('mute'):
        if (self.hasClass('on')) {
          self.removeClass('on');
          self.text('Mute');
          pnut.unmute(self.parent().data('userid'), self.parent().data('username'), csrf);

        } else {
          self.addClass('on');
          self.text('Unmute');
          pnut.mute(self.parent().data('userid'), self.parent().data('username'), csrf);
        }
        break;
    }
  });

  checkUrl();

  $(window).bind('hashchange', function() {
    checkUrl();
  });

  /* Notifications */
  notifications.on('click', '.notification-item', function(ev) {
    ev.preventDefault();
    var self = $(this);

    notifications.slideUp();
    pnut.showPost(self.data('postid'));
    body.addClass('fixed');
  });

  /* Write functionality */

  checkCharLimit(write.find('textarea').val());

  write.find('textarea').focus(function() {
    var self = $(this);
    self.addClass('on');
    charLimit.addClass('on');
    checkCharLimit(self.val());
    self.closest('form').find('.form-action-wrapper').show();
  });

  write.find('textarea').blur(function() {
    var self = $(this);

    charLimit.removeClass('on');

    if (self.val().replace(/\s/, '').length < 1) {
      self.removeClass('on');
      self.closest('form').find('.form-action-wrapper').hide();
    }
  });

  write.find('textarea').keyup(function(evt) {
    var self = $(this);
    checkCharLimit(self.val());
    friends.getBFFs(self, self.getCursorPosition());
  });

  write.submit(function(ev) {
    ev.preventDefault();

    var self = $(this);
    pnut.postMessage(self);
    url = '/my/feed';
    charLimit.text(CHAR_MAX);
    write.find('.reply_to').val('');
  });

  suggestions.on('click', 'li', function() {
    var self = $(this);
    var textarea = self.closest('form').find('textarea');
    friends.setUser(self, textarea, textarea.getCursorPosition());
  });
});
