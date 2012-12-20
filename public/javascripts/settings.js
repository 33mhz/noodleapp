define(['jquery', 'jquery.timezone-picker'],
  function($, tp) {
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
  }
);
