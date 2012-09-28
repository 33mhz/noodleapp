'use strict';

requirejs.config({
  baseUrl: '/javascripts/lib',
  enforceDefine: true,
  paths: {
    jquery: 'https://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min'
  }
});

define(['jquery', 'appnet'],
  function($, appnet) {

  var url = $('body').data('url');
  var tabs = $('ol.tabs');
  var userMentions = tabs.find('.user-mentions');
  var globalFeed = tabs.find('.global-feed');
  var userPosts = tabs.find('.user-posts');
  var userStarred = tabs.find('.user-starred');
  var myFeed = tabs.find('.my-feed');
  var messages = $('ol.messages');
  var write = $('#write form');
  var userInfo = $('.user-info');
  var overlay = $('#overlay');
  var dashboard = $('.dashboard-content');
  var charLimit = $('#count');
  var body = $('body');
  var csrf = write.find('input[name="_csrf"]').val();

  var CHAR_MAX = 256;

  var resetTab = function(self, callback) {
    self.siblings().removeClass('selected');
    self.addClass('selected');
    callback();
  };

  var freezeDashboard = function() {
    dashboard.addClass('fixed');
  };

  var checkCharLimit = function(text) {
    var textLength = text.length;
    if (textLength > CHAR_MAX - 1) {
      write.find('textarea').val(text.substr(0, CHAR_MAX));
      charLimit.text(0);
    } else {
      charLimit.text(CHAR_MAX - textLength);
    }
  };

  /* Feed functionality */

  myFeed.click(function() {
    var self = $(this);
    messages.empty();
    resetTab(self, function() {
      appnet.getMyFeed();
    });
  });

  globalFeed.click(function() {
    var self = $(this);
    messages.empty();
    resetTab(self, function() {
      appnet.getGlobalFeed();
    });
  });

  userPosts.click(function() {
    var self = $(this);
    messages.empty();
    resetTab(self, function() {
      appnet.getUserPosts();
    });
  });

  userMentions.click(function() {
    var self = $(this);
    messages.empty();
    resetTab(self, function() {
      appnet.getUserMentions();
    });
  });

  userStarred.click(function() {
    var self = $(this);
    messages.empty();
    resetTab(self, function() {
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
    write.find('textarea').val('@' + self.closest('.message-item').data('username') + ' ');
    write.find('#reply_to').val(self.closest('.message-item').data('id'));
    document.location.href = '#top';
    write.find('textarea').focus();
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
    freezeDashboard();
  });

  body.on('click', 'time', function() {
    var self = $(this);
    appnet.showPost(self.closest('.message-item').data('id'));
    freezeDashboard();
  });

  body.on('click', 'a.tags', function(ev) {
    ev.preventDefault();
    var self = $(this);
    appnet.showTagged(self.attr('href').split('/tagged/')[1]);
    freezeDashboard();
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
      appnet.unfollow(self.parent().data('userid'), csrf);
    } else {
      self.addClass('on');
      self.text('Unfollow');
      appnet.follow(self.parent().data('userid'), csrf);
    }
  });

  userInfo.on('click', '.mute', function() {
    var self = $(this);
    if (self.hasClass('on')) {
      self.removeClass('on');
      self.text('Mute');
      appnet.unmute(self.parent().data('userid'), csrf);
    } else {
      self.addClass('on');
      self.text('Unmute');
      appnet.mute(self.parent().data('userid'), csrf);
    }
  });

  userInfo.on('click', '.followers', function() {
    var self = $(this);
    appnet.showFollowers();
    freezeDashboard();
  });

  userInfo.on('click', '.following', function() {
    var self = $(this);
    appnet.showFollowing();
    freezeDashboard();
  });

  overlay.on('click', '.close', function() {
    overlay.slideUp(function() {
      $(this).html('');
      dashboard.removeClass('fixed');
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

  // Clear the reply_to id if this is empty
  write.find('textarea').keyup(function() {
    var self = $(this);
    checkCharLimit(self.val());
    if (self.val().trim().length === 0) {
      write.find('#reply_to').val('');
    }
  });

  write.submit(function(ev) {
    ev.preventDefault();

    var self = $(this);
    appnet.postMessage(self);
    url = '/my/feed';
    self.find('textarea').val('');
    charLimit.text(CHAR_MAX);
    return false;
  });
});
