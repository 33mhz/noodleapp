/*global document:true, requirejs:true */
'use strict';

requirejs.config({
  baseUrl: '/javascripts/',
  enforceDefine: true,
  paths: {
    jquery: '/javascripts/jquery'
  }
});

define(['jquery', 'appnet', 'friends', 'user'],
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
  var currentScrollTop = '';
  var win = $(window);
  var csrf = write.find('input[name="_csrf"]').val();

  var CHAR_MAX = 256;
  var TAB_KEYCODE = 9;

  var resetTab = function(self, callback) {
    self.siblings().removeClass('selected');
    self.addClass('selected');
    callback();
  };

  var checkCharLimit = function(text) {
    if (text) {
      var textLength = text.length;
      if (textLength > CHAR_MAX - 1) {
        write.find('textarea').val(text.substr(0, CHAR_MAX));
        charLimit.text(0);
      } else {
        charLimit.text(CHAR_MAX - textLength);
      }
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

  messages.on('click', '.details .reply', function() {
    var self = $(this);
    var mentions = (self.closest('.message-item').data('mentions') !== '') ? self.closest('.message-item').data('mentions') + ' ' : '';
    write.find('textarea').focus();
    write.find('textarea').val('@' + self.closest('.message-item').data('username') + ' ' + mentions);
    write.find('.reply_to').val(self.closest('.message-item').data('id'));
    document.location.href = '#top';
  });

  messages.on('click', '.details .star', function() {
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

  messages.on('click', '.details .repost', function() {
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

  messages.on('click', '.details .delete', function() {
    var self = $(this);
    appnet.deleteMessage(self.closest('.message-item').data('id'), csrf);
    self.closest('li.message-item').fadeOut();
  });

  messages.on('click', '.details .thread', function() {
    var self = $(this);
    appnet.showThread(self.closest('.message-item').data('id'));
    body.addClass('fixed');
  });

  body.on('click', 'time', function() {
    var self = $(this);
    appnet.showPost(self.closest('.message-item').data('id'), self.closest('.message-item').data('username'));
    body.addClass('fixed');
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
    charLimit.addClass('on');
    checkCharLimit(self.val());
  });

  write.find('textarea').blur(function() {
    charLimit.removeClass('on');
  });

  body.on('click', function(ev) {
    if (!$(ev.target).hasClass('writeable')) {
      suggestions.empty();
    }
  });

  // Clear the reply_to id if this is empty
  write.find('textarea').keyup(function(evt) {
    var self = $(this);
    checkCharLimit(self.val());
    friends.getBFFs(self, self.val().toLowerCase());
    if (self.val().trim().length === 0) {
      write.find('.reply_to').val('');
    }
  }).keydown(function(evt) {
    if(evt.keyCode === 9) {
      // Pressing TAB autocompletes to the first user listed.
      var userLi = suggestions.find('li:first');
      if(userLi.length) {
        friends.setUser(userLi, userLi.closest('.write'));
        suggestions.empty();
        return false;
      }
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
    friends.setUser(self, self.closest('.write'));
  });

  body.on('click', '#settings-link', function(ev) {
    ev.preventDefault();

    user.getSettings();
  });

  body.on('click', '#directed-feed, #media-on', function() {
    var self = $(this);
    var directedFeed = false;
    var mediaOn = false;

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

    user.saveSettings(directedFeed, mediaOn, write.find('input[name="_csrf"]').val());
  });
});
