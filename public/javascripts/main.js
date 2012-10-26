/*global document:true, requirejs:true */
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
  var url = $('body').data('url');
  var tabs = $('ol.tabs');
  var settings = $('#settings-link');
  var userMentions = tabs.find('.user-mentions');
  var globalFeed = tabs.find('.global-feed');
  var userPosts = tabs.find('.user-posts');
  var userStarred = tabs.find('.user-starred');
  var myFeed = tabs.find('.my-feed');
  var messages = $('ol.messages');
  var write = $('.write form');
  var userInfo = $('.user-info');
  var overlay = $('#overlay');
  var dashboard = $('.dashboard-content');
  var charLimit = $('.counter');
  var suggestions = $('ol.suggestions');
  var notifications = $('#notifications-preview');
  var unreadMessages = $('#unread-messages');
  var currentScrollTop = '';
  var win = $(window);
  var csrf = write.find('input[name="_csrf"]').val();
  var postLoad = false;

  var CHAR_MAX = parseInt(body.data('charlimit'), 10);
  var TAB_KEYCODE = 9;
  var MESSAGE_LIMIT = 99;

  var resetTab = function(self, callback) {
    self.siblings().removeClass('selected');
    self.addClass('selected');
    callback();
  };

  var checkUrl = function() {
    if (document.location.hash.indexOf('/post/') > -1) {
      var postArray = document.location.hash.split('/post/')[1].split('/');
      var postId = postArray[0];
      var usernameId = postArray[1];
      appnet.showPost(postId, usernameId);
      body.addClass('fixed');
    }
  };

  var checkCharLimit = function(text) {
    if (text) {
      write.find('button').removeClass('disabled');
      var textLength = text.length;
      if (textLength > CHAR_MAX - 1) {
        write.find('textarea').val(text.substr(0, CHAR_MAX));
        charLimit.text(0);
      } else {
        charLimit.text(CHAR_MAX - textLength);
      }
    } else {
      write.find('button').addClass('disabled');
      charLimit.text(CHAR_MAX);
    }
  };

  var updateFeed = function(self, callback) {
    messages.empty();
    resetTab(self, function() {
      callback();
    });
  };

  /* Feed functionality */

  myFeed.click(function() {
    updateFeed($(this), function() {
      appnet.getMyFeed();
    });
  });

  globalFeed.click(function() {
    updateFeed($(this), function() {
      appnet.getGlobalFeed();
    });
  });

  userPosts.click(function() {
    updateFeed($(this), function() {
      appnet.getUserPosts();
    });
  });

  userMentions.click(function() {
    updateFeed($(this), function() {
      appnet.getUserMentions();
    });
  });

  userStarred.click(function() {
    updateFeed($(this), function() {
      appnet.getUserStarred();
    });
  });

  /* Automatic feed loader */

  if (url === '/global/feed') {
    globalFeed.click();
  } else if (url.match(/\/user\/posts/)) {
    userPosts.click();
  } else if (url.match(/\/user\/mentions/)) {
    userMentions.click();
  } else if (url.match(/\/user\/starred/)) {
    userStarred.click();
  } else {
    // Defaults to first tab
    tabs.find('.selected').click();
  }

  /* Message functionality */

  body.on('click', '.reply', function() {
    var self = $(this);
    var messageItem = self.closest('.message-item');
    var mentions = (messageItem.data('mentions') !== '') ? messageItem.data('mentions') + ' ' : '';
    write.find('textarea').focus();
    write.find('.form-action-wrapper').slideDown('fast');
    write.find('textarea').val('@' + messageItem.data('username') + ' ' + mentions);
    if (parseInt(messageItem.data('replyto'), 10) > 0) {
      write.find('.reply_to').val(messageItem.data('replyto'));
    } else {
      write.find('.reply_to').val(messageItem.data('id'));
    }
    document.location.href = '#top';
  });

  body.on('click', '.star', function() {
    var self = $(this);
    if (self.hasClass('on')) {
      self.removeClass('on');
      self.find('span').text('Star');
      appnet.unstarMessage(self.closest('.message-item').data('id'), csrf);
    } else {
      self.addClass('on');
      self.find('span').text('Unstar');
      appnet.starMessage(self.closest('.message-item').data('id'), csrf);
    }
  });

  body.on('click', '.repost', function() {
    var self = $(this);
    if (self.hasClass('on')) {
      self.removeClass('on');
      self.find('span').text('Repost');
      appnet.unrepostMessage(self.closest('.message-item').data('id'), csrf);
    } else {
      self.addClass('on');
      self.find('span').text('Unrepost');
      appnet.repostMessage(self.closest('.message-item').data('id'), csrf);
    }
  });

  messages.on('click', '.quote', function() {
    var self = $(this);

    write.find('textarea').focus();
    write.find('.form-action-wrapper').slideDown('fast');
    write.find('textarea').val('"' + self.closest('.message-item').data('original') + '"');
  });

  overlay.on('click', '.quote', function() {
    var self = $(this);

    overlay.find('textarea').focus();
    overlay.find('textarea').val('"' + self.closest('.message-item').data('original') + '"');
  });

  messages.on('click', '.delete', function() {
    var self = $(this);
    appnet.deleteMessage(self.closest('.message-item').data('id'), csrf);
    self.closest('li.message-item').fadeOut();
  });

  body.on('click', '.thread', function() {
    var self = $(this);
    appnet.showThread(self.closest('.message-item').data('id'));
    body.addClass('fixed');
  });

  body.on('click', 'time', function() {
    var self = $(this);
    document.location.hash = '/post/' + self.closest('.message-item').data('id') +
      '/' + self.closest('.message-item').data('username');
  });

  checkUrl();

  $(window).bind('hashchange', function() {
    checkUrl();
  });

  var notificationsDisplay = false;

  body.on('click', '#notifications', function(ev) {
    ev.preventDefault();
    var self = $(this);
    self
      .removeClass('on')
      .text(0);
    document.title = 'NoodleApp';
    appnet.resetUnread();
    if (!notificationsDisplay) {
      notifications.slideDown();
      notificationsDisplay = true;
    } else {
      notifications.slideUp();
      notificationsDisplay = false;
    }
  });

  body.on('click', 'a.notification-item', function(ev) {
    ev.preventDefault();
    var self = $(this);
    notifications.slideUp();
    appnet.showPost(self.data('postid'), self.data('username'));
    body.addClass('fixed');
  });

  body.on('click', 'a.tags', function(ev) {
    ev.preventDefault();
    var self = $(this);
    appnet.showTagged(self.attr('href').split('/tagged/')[1]);
    body.addClass('fixed');
  });

  messages.on('click', '#paginated', function() {
    var self = $(this);
    appnet.getOlderPosts(self.prev().data('id'));
  });

  /* User functionality */

  userInfo.on('click', '.follow', function() {
    var self = $(this);
    if (self.hasClass('on')) {
      self.removeClass('on');
      self.text('Follow');
      appnet.unfollow(self.parent().data('userid'), self.parent().data('username'), csrf);
    } else {
      self.addClass('on');
      self.text('Unfollow');
      appnet.follow(self.parent().data('userid'), self.parent().data('username'), csrf);
    }
  });

  userInfo.on('click', '.mute', function() {
    var self = $(this);
    if (self.hasClass('on')) {
      self.removeClass('on');
      self.text('Mute');
      appnet.unmute(self.parent().data('userid'), self.parent().data('username'), csrf);
    } else {
      self.addClass('on');
      self.text('Unmute');
      appnet.mute(self.parent().data('userid'), self.parent().data('username'), csrf);
    }
  });

  userInfo.on('click', '.followers', function() {
    var self = $(this);
    appnet.showFollowers();
  });

  userInfo.on('click', '.following', function() {
    var self = $(this);
    appnet.showFollowing();
  });

  overlay.on('click', '.close', function() {
    window.history.pushState('', '', document.location.href.split('#')[0]);
    overlay.find('.inner-overlay').html('');
    overlay.find('textarea').val('');
    overlay.slideUp(function() {
      body.removeClass('fixed');
    });
  });

  /* Write functionality */

  checkCharLimit(write.find('textarea').val());

  write.find('textarea').focus(function() {
    var self = $(this);
    self.addClass('on');
    charLimit.addClass('on');
    checkCharLimit(self.val());
  });

  write.find('textarea').blur(function() {
    var self = $(this);

    charLimit.removeClass('on');

    if (self.val().replace(/\s/, '').length < 1) {
      self.removeClass('on');
      self.closest('form').find('.form-action-wrapper').slideUp('fast');
    }
  });

  body.on('click', function(ev) {
    var target = $(ev.target);
    if (!target.hasClass('writeable')) {
      suggestions.empty();
    }
    if (notificationsDisplay &&
        !(target.is('#notifications-preview') ||
          target.is('#notifications') ||
          target.closest('#notifications-preview').length)) {
      notifications.slideUp();
      notificationsDisplay = false;
    }
  });

  write.find('textarea').focus(function() {
    var self = $(this);

    self.closest('form').find('.form-action-wrapper').slideDown('fast');
  });

  // Clear the reply_to id if this is empty
  write.find('textarea').keyup(function(evt) {
    var self = $(this);
    checkCharLimit(self.val());
    friends.getBFFs(self, self.getCursorPosition());
    if (self.val().trim().length === 0) {
      write.find('.reply_to').val('');
    }
  }).keydown(function(evt) {
    var self = $(this);
    if (evt.keyCode === 9 || evt.keyCode === 32) {
      // Pressing TAB/space autocompletes to the first user listed.
      var userLi = suggestions.find('li:first');
      if (userLi.length) {
        friends.setUser(userLi, self, self.getCursorPosition());
        suggestions.empty();
        return false;
      }
    } else if (evt.keyCode === 13 && (evt.ctrlKey || evt.metaKey)) {
      self.submit();
    }
  });

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

  /* Settings functionality */
  body.on('click', '#settings-link', function(ev) {
    ev.preventDefault();

    user.getSettings();
  });

  body.on('click', '#directed-feed, #media-on, #charlimit', function() {
    var self = $(this);
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
  });

  /* Unread messages functionality */
  body.on('click', '#unread-messages', function() {
    var self = $(this);
    appnet.clearUnread(self);
  });
});
