'use strict';

requirejs.config({
  baseUrl: '/javascripts/',
  enforceDefine: true,
  paths: {
    jquery: '/javascripts/jquery'
  }
});

define(['jquery', 'appnet', 'friends', 'user', 'jquery.caret'],
  function($, appnet, friends, user) {
  var body = $('body');
  var url = body.data('url');
  var tabs = body.find('ol.tabs');
  var messages = body.find('ol.messages');
  var write = body.find('.write form');
  var userInfo = body.find('.user-info');
  var overlay = body.find('#overlay');
  var charLimit = body.find('.counter');
  var suggestions = body.find('ol.suggestions');
  var notifications = body.find('#notifications-preview');
  var notificationIcon = body.find('#notifications');
  var win = $(window);
  var doc = $(document);
  var csrf = write.find('input[name="_csrf"]').val();
  var postLoad = false;
  var notificationsDisplay = false;
  var currentMessage;

  var CHAR_MAX = parseInt(body.data('charlimit'), 10);

  var
    TAB_KEYCODE = 9,
    RETURN_KEYCODE = 13,
    ESCAPE_KEYCODE = 27,
    SPACE_KEYCODE = 32,
    F_KEYCODE = 70,
    J_KEYCODE = 74,
    K_KEYCODE = 75,
    P_KEYCODE = 80,
    Q_KEYCODE = 81,
    R_KEYCODE = 82,
    S_KEYCODE = 83,
    T_KEYCODE = 84,
    U_KEYCODE = 85;

  var MESSAGE_LIMIT = 99;

  var resetNotificationDisplay = function() {
    notificationIcon
      .removeClass('on')
      .text(0);
    document.title = 'NoodleApp';
    appnet.resetUnread();
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
      appnet.showPost(postId);
      body.addClass('fixed');
    } else if (hash.indexOf('/tagged/') > -1) {
      appnet.showTagged(hash.split('/tagged/')[1]);
      body.addClass('fixed');
    } else if (hash.length < 3 && body.hasClass('fixed')) {
       closeOverlay();
    }
  };

  // Length of actual text that will be posted to app.net
  var getEffectiveLength = function(text) {
    // Same as in markdown-to-entities, but global
    var markdownLinkRegex = /\[([^\]]+)\]\((\S+(?=\)))\)/g;
    return text.replace(markdownLinkRegex, '$1').length;
  };

  var checkCharLimit = function(text) {
    var textLength = getEffectiveLength(text);
    write.find('button').toggleClass('disabled', textLength === 0);
    if (textLength > CHAR_MAX) {
      charLimit.addClass('over');
      charLimit.text('- ' + (textLength - CHAR_MAX));
    } else {
      charLimit.removeClass('over');
      charLimit.text(CHAR_MAX - textLength);
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
    });
  };

  var saveSettings = function(self) {
    var directedFeed = false;
    var mediaOn = false;
    var charLimit = false;

    if (self.hasClass('on')) {
      self.removeClass('on');
    } else {
      self.addClass('on');
    }

    if (overlay.find('#directed-feed').hasClass('on')) {
      directedFeed = true;
    }

    if (overlay.find('#media-on').hasClass('on')) {
      mediaOn = true;
    }

    if (overlay.find('#charlimit').hasClass('on')) {
      charLimit = true;
    }

    user.saveSettings(directedFeed, mediaOn, charLimit, write.find('input[name="_csrf"]').val());
  };

  /* Feed functionality */
  tabs.on('click', function(ev) {
    var self = $(ev.target);

    switch (true) {
      case self.hasClass('global-feed'):
        updateFeed(self, function() {
          appnet.getGlobalFeed();
        });
        break;

      case self.hasClass('user-posts'):
        updateFeed(self, function() {
          appnet.getUserPosts();
        });
        break;

      case self.hasClass('user-mentions'):
        updateFeed(self, function() {
          appnet.getUserMentions();
        });
        break;

      case self.hasClass('user-interactions'):
        updateFeed(self, function() {
          appnet.getUserInteractions();
        });
        break;

      case self.hasClass('user-starred'):
        updateFeed(self, function() {
          appnet.getUserStarred();
        });
        break;

      default:
        updateFeed(self, function() {
          appnet.getMyFeed();
        });
        break;
    }
  });

  /* Automatic feed loader */
  tabs.find('.selected').click();

  /* Message functionality */
  messages.on('click', function(ev) {
    var self = $(ev.target);

    switch (true) {
      case self.hasClass('reply'):
        self.closest('.message-item').find('time').click();
        break;

      case self.hasClass('quote'):
        var textarea = self.closest('.dashboard-content').find('textarea');
        textarea.focus();
        write.find('.form-action-wrapper').slideDown('fast');
        textarea.val('"' + self.closest('.message-item').data('original') + '"');
        break;

      case self.hasClass('delete'):
        appnet.deleteMessage(self.closest('.message-item').data('id'), csrf);
        self.closest('li.message-item').fadeOut();
        break;

      case self.hasClass('thread'):
        appnet.showThread(self.closest('.message-item').data('id'));
        body.addClass('fixed');
        break;

      case self.is('#paginated'):
        appnet.getOlderPosts(self.prev().data('id'));
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

    switch (true) {
      case self.hasClass('reply'):
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

      case self.hasClass('thread'):
        appnet.showThread(self.closest('.message-item').data('id'));
        body.addClass('fixed');
        break;

      case selfLink.hasClass('close'):
        closeOverlay();
        break;

      case self.hasClass('quote'):
        var textarea = overlay.find('textarea');
        textarea.focus();
        overlay.find('.form-action-wrapper').slideDown('fast');
        textarea.val('"' + self.closest('.message-item').data('original') + '"');
        break;
    }
  });

  // General activity for all shared functionality
  body.on('click', function(ev) {
    var self = $(ev.target);

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
      case self.hasClass('star'):
        if (self.hasClass('on')) {
          self.removeClass('on');
          self.find('span').text('Star');
          appnet.unstarMessage(self.closest('.message-item').data('id'), csrf);
        } else {
          self.addClass('on');
          self.find('span').text('Unstar');
          appnet.starMessage(self.closest('.message-item').data('id'), csrf);
        }
        break;

      case self.hasClass('repost'):
        if (self.hasClass('on')) {
          self.removeClass('on');
          self.find('span').text('Repost');
          appnet.unrepostMessage(self.closest('.message-item').data('id'), csrf);
        } else {
          self.addClass('on');
          self.find('span').text('Unrepost');
          appnet.repostMessage(self.closest('.message-item').data('id'), csrf);
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
        var self = $(this);
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
        user.getSettings();
        break;

      case self.is('#charlimit'):
      case self.is('#media-on'):
      case self.is('#directed-feed'):
        saveSettings(self);
        break;

      case self.parent().is('#unread-messages'):
        appnet.clearUnread(self.parent());
        resetNotificationDisplay();
        if (messages.find('> li').length >= 20 && messages.find('#paginated').length === 0) {
          messages.append('<li id="paginated">View Older</li>');
        }
        break;
    }
  });

  var keyCodeToClassName = {};
  keyCodeToClassName[T_KEYCODE] = '.thread';
  keyCodeToClassName[S_KEYCODE] = '.star';
  keyCodeToClassName[R_KEYCODE] = '.reply';
  keyCodeToClassName[P_KEYCODE] = '.repost';
  keyCodeToClassName[Q_KEYCODE] = '.quote';

  body.on('keydown', function(ev) {
    var self = $(ev.target);

    if (ev.keyCode === ESCAPE_KEYCODE && body.hasClass('fixed')) {
      closeOverlay();
    }

    switch (true) {
      case self.hasClass('submittable'):
        if (ev.keyCode === TAB_KEYCODE || ev.keyCode === SPACE_KEYCODE) {
          // Pressing TAB/space autocompletes to the first user listed.
          var userLi = suggestions.find('li:first');
          if (userLi.length) {
            friends.setUser(userLi, self, self.getCursorPosition());
            suggestions.empty();
            return false;
          }

        } else if (ev.keyCode === RETURN_KEYCODE && (ev.ctrlKey || ev.metaKey)) {
          self.closest('form').submit();
        }
    }

    if (!(self.is('textarea') || ev.ctrlKey || ev.shiftKey || ev.metaKey)) {
      if (ev.keyCode === K_KEYCODE || ev.keyCode === J_KEYCODE) {
        currentMessage = body.find('.message-item.hover');
        if (!currentMessage.length) {
          currentMessage = body.find('.message-item:first');
          currentMessage.addClass('hover');
          return;
        }

        var next;
        if (ev.keyCode === K_KEYCODE) {
          next = currentMessage.prev('.message-item');
        } else {
          next = currentMessage.next('.message-item');
        }

        if (next.length) {
          currentMessage.removeClass('hover');
          next.addClass('hover');
          $(window).scrollTop(next.position().top - 40);
          currentMessage = next;
        }
        ev.preventDefault();
      }

      if (currentMessage && keyCodeToClassName[ev.keyCode]) {
        currentMessage.find(keyCodeToClassName[ev.keyCode]).click();
        ev.preventDefault();
      }
    }
  });

  /* User functionality */
  userInfo.on('click', function(ev) {
    var self = $(ev.target);

    switch (true) {
      case self.hasClass('followers'):
        appnet.showFollowers();
        body.addClass('fixed');
        break;

      case self.hasClass('following'):
        appnet.showFollowing();
        body.addClass('fixed');
        break;

      case self.hasClass('follow'):
        if (self.hasClass('on')) {
          self.removeClass('on');
          self.text('Follow');
          appnet.unfollow(self.parent().data('userid'), self.parent().data('username'), csrf);

        } else {
          self.addClass('on');
          self.text('Unfollow');
          appnet.follow(self.parent().data('userid'), self.parent().data('username'), csrf);
        }
        break;

      case self.hasClass('mute'):
        if (self.hasClass('on')) {
          self.removeClass('on');
          self.text('Mute');
          appnet.unmute(self.parent().data('userid'), self.parent().data('username'), csrf);

        } else {
          self.addClass('on');
          self.text('Unmute');
          appnet.mute(self.parent().data('userid'), self.parent().data('username'), csrf);
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
    appnet.showPost(self.data('postid'));
    body.addClass('fixed');
  });

  /* Write functionality */

  checkCharLimit(write.find('textarea').val());

  write.find('textarea').focus(function() {
    var self = $(this);
    self.addClass('on');
    charLimit.addClass('on');
    checkCharLimit(self.val());
    self.closest('form').find('.form-action-wrapper').slideDown('fast');
  });

  write.find('textarea').blur(function() {
    var self = $(this);

    charLimit.removeClass('on');

    if (self.val().replace(/\s/, '').length < 1) {
      self.removeClass('on');
      self.closest('form').find('.form-action-wrapper').slideUp('fast');
    }
  });

  // Clear the reply_to id if this is empty
  write.find('textarea').keyup(function(evt) {
    var self = $(this);
    checkCharLimit(self.val());
    friends.getBFFs(self, self.getCursorPosition());
    if (self.val().trim().length === 0) {
      write.find('.reply_to').val('');
    }

  })

  write.submit(function(ev) {
    ev.preventDefault();

    var self = $(this);
    appnet.postMessage(self);
    url = '/my/feed';
    self.find('textarea').val('');
    charLimit.text(CHAR_MAX);
    write.find('.reply_to').val('');
    return false;
  });

  suggestions.on('click', 'li', function() {
    var self = $(this);
    var textarea = self.closest('form').find('textarea');
    friends.setUser(self, textarea, textarea.getCursorPosition());
  });
});
