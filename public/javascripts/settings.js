requirejs.config({
  baseUrl: '/javascripts/',
  enforceDefine: true,
  shim: {
    'jquery.timezone-picker': {
      deps: ['jquery', 'jquery.maphilight'],
      exports: 'jQuery.fn.timezonePicker'
    },
    'jquery.maphilight': {
      deps: ['jquery'],
      exports: 'jQuery.fn.maphilight'
    }
  }
});

define(['jquery', 'jquery.timezone-picker'],
  function($, tp) {
    var flashMsg = $('#flash-message', window.top.document);
    var flashMessage = function(message) {
      flashMsg.text(message);
      flashMsg.fadeIn(200, function() {
        $(this).fadeOut(3500);
      });
    };

    if($(document.body).data('isPostback')) {
      flashMessage('Saved! Please refresh.');
    }

    $('#user-timezone-image').timezonePicker({
      target: '#user-timezone'
    });

    var settingsDetails = $('.settings-details');
    settingsDetails.on('click', '.settings-toggle', function(evt) {
      var self = $(this);
      self.toggleClass('on');
      $(self).find('input').val(self.hasClass('on'));
      evt.preventDefault();
    });

    // TODO: Refactor this and flashMessage to eliminate code duplication
    settingsDetails.find('.close').on('click', function(evt) {
      var overlay = $('#overlay', window.top.document);
      var body = $(window.top.document.body);
      window.history.pushState('', '', document.location.href.split('#')[0]);
      overlay.slideUp(function() {
        body.removeClass('fixed');
        overlay.removeClass('settings-overlay');
        overlay.find('.inner-overlay').html('');
      });
    });
  }
);