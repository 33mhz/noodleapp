'use strict';

// Generate Mixcloud iframe
var SERVICE_MIXCLOUD = /(mixcloud\.com\/\w+\/\w+)/i;

exports.process = function(media, remix, options) {
  if (!remix.isMatched && media.match(SERVICE_MIXCLOUD)) {
    remix.isMatched = true;

    var mixcloudURL = escape(media);

    remix.result = '<object width="' + options.width + '" height="' +
      options.height + '"><param name="movie" value="http://www.mixcloud.com/media/swf/' +
      'player/mixcloudLoader.swf?feed=' + mixcloudURL + '&embed_type=widget_standard"></param>' +
      '<param name="allowFullScreen" value="false"></param><param name="wmode" value="opaque">' +
      '</param><param name="allowscriptaccess" value="always"></param><embed src="//www.mixcloud.com/' +
      'media/swf/player/mixcloudLoader.swf?feed=' + mixcloudURL + '&embed_type=widget_standard" ' +
      'type="application/x-shockwave-flash" wmode="opaque" allowscriptaccess="always" ' +
      'allowfullscreen="true" width="' + options.width + '" height="' + options.height + '">' +
      '</embed></object><div style="clear:both; height:3px;">' +
      '<div style="clear:both; height:3px;"></div></div><a href="' + mixcloudURL + '" ' +
       'class="media-link" target="_blank">' + mixcloudURL + '</a>';
  }
  return remix;
};
