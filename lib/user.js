'use strict';

var utils = require('./utils');
var appnet = require('./appnet');
var markdownToEntities = require('./markdown-to-entities');
var xtend = require('xtend');

// From Alpha settings page
var languages = [{
  name: 'Albanian',
  value: 'sq_AL'
}, {
  name: 'العربيّة (Arabic)',
  value: 'ar_AA'
}, {
  name: 'español de Argentina (Argentinian Spanish)',
  value: 'es_AR'
}, {
  name: 'azərbaycan dili (Azerbaijani)',
  value: 'az_AZ'
}, {
  name: 'Basque',
  value: 'eu_ES'
}, {
  name: 'bosanski (Bosnian)',
  value: 'bs_BA'
}, {
  name: 'Português Brasileiro (Brazilian Portuguese)',
  value: 'pt_BR'
}, {
  name: 'British English',
  value: 'en_GB'
}, {
  name: 'български (Bulgarian)',
  value: 'bg_BG'
}, {
  name: 'català (Catalan)',
  value: 'ca_ES'
}, {
  name: 'Hrvatski (Croatian)',
  value: 'hr_HR'
}, {
  name: 'česky (Czech)',
  value: 'cs_CZ'
}, {
  name: 'Dansk (Danish)',
  value: 'da_DK'
}, {
  name: 'Nederlands (Dutch)',
  value: 'nl_NL'
}, {
  name: 'English',
  value: 'en_US'
}, {
  name: 'eesti (Estonian)',
  value: 'et_EE'
}, {
  name: 'suomi (Finnish)',
  value: 'fi_FI'
}, {
  name: 'Français (French)',
  value: 'fr_FR'
}, {
  name: 'galego (Galician)',
  value: 'gl_ES'
}, {
  name: 'ქართული (Georgian)',
  value: 'ka_GE'
}, {
  name: 'Deutsch (German)',
  value: 'de_DE'
}, {
  name: 'Ελληνικά (Greek)',
  value: 'el_GR'
}, {
  name: 'עברית (Hebrew)',
  value: 'he_IL'
}, {
  name: 'Hindi',
  value: 'hi_IN'
}, {
  name: 'Magyar (Hungarian)',
  value: 'hu_HU'
}, {
  name: 'Íslenska (Icelandic)',
  value: 'is_IS'
}, {
  name: 'Bahasa Indonesia (Indonesian)',
  value: 'id_ID'
}, {
  name: 'Gaeilge (Irish)',
  value: 'ga_IE'
}, {
  name: 'italiano (Italian)',
  value: 'it_IT'
}, {
  name: '日本語 (Japanese)',
  value: 'ja_JP'
}, {
  name: 'Kannada',
  value: 'kn_IN'
}, {
  name: '한국어 (Korean)',
  value: 'ko_KR'
}, {
  name: 'latviešu (Latvian)',
  value: 'lv_LV'
}, {
  name: 'Lithuanian',
  value: 'lt_LT'
}, {
  name: 'Македонски (Macedonian)',
  value: 'mk_MK'
}, {
  name: 'Malayalam',
  value: 'ml_IN'
}, {
  name: 'español de Mexico (Mexican Spanish)',
  value: 'es_MX'
}, {
  name: 'español de Nicaragua (Nicaraguan Spanish)',
  value: 'es_NI'
}, {
  name: 'Norsk (Norwegian)',
  value: 'no_NO'
}, {
  name: 'Norsk (bokmål) (Norwegian Bokmal)',
  value: 'nb_NO'
}, {
  name: 'Norsk (nynorsk) (Norwegian Nynorsk)',
  value: 'nn_NO'
}, {
  name: 'فارسی (Persian)',
  value: 'fa_IR'
}, {
  name: 'polski (Polish)',
  value: 'pl_PL'
}, {
  name: 'Português (Portuguese)',
  value: 'pt_PT'
}, {
  name: 'Punjabi',
  value: 'pa_IN'
}, {
  name: 'Română (Romanian)',
  value: 'ro_RO'
}, {
  name: 'Русский (Russian)',
  value: 'ru_RU'
}, {
  name: 'српски (Serbian)',
  value: 'sr_RS'
}, {
  name: '简体中文 (Simplified Chinese)',
  value: 'zh_CN'
}, {
  name: 'slovenský (Slovak)',
  value: 'sk_SK'
}, {
  name: 'Slovenščina (Slovenian)',
  value: 'sl_SI'
}, {
  name: 'español (Spanish)',
  value: 'es_ES'
}, {
  name: 'Svenska (Swedish)',
  value: 'sv_SE'
}, {
  name: 'தமிழ் (Tamil)',
  value: 'ta_IN'
}, {
  name: 'Татарча (Tatar)',
  value: 'tt_RU'
}, {
  name: 'తెలుగు (Telugu)',
  value: 'te_IN'
}, {
  name: 'Thai',
  value: 'th_TH'
}, {
  name: '繁體中文 (Traditional Chinese)',
  value: 'zh_TW'
}, {
  name: 'Türkçe (Turkish)',
  value: 'tr_TR'
}, {
  name: 'Українська (Ukrainian)',
  value: 'uk_UA'
}, {
  name: 'اردو (Urdu)',
  value: 'ur_PK'
}, {
  name: 'Vietnamese',
  value: 'vi_VN'
}, {
  name: 'Cymraeg (Welsh)',
  value: 'cy_GB'
}];

var toggleSettings = [{
  name: 'directedFeed',
  description: 'Include posts directed to users I don\'t follow'
}, {
  name: 'mediaOn',
  description: 'Auto-embed media'
}, {
  name: 'charLimit',
  description: 'Limit to 140 characters'
}, {
  name: 'highContrast',
  description: 'Set high contrast interface'
}];

exports.bffUser = function(userId, username, client) {
  client.sadd('userBFFs:' +  userId, username);
};

exports.unbffUser = function(userId, username, client) {
  client.srem('userBFFs:' +  userId, username);
};

exports.bffs = function(userId, client, callback) {
  client.smembers('userBFFs:' +  userId, callback);
  client.expire('userBFFs:' +  userId, 60 * 60 * 24 * 3); // 3 days
};

exports.getLocalSettings = function(req, client, callback) {
  var user = utils.getUser(req);
  var userId = user.id;

  client.hgetall('settings:' + userId, function(err, userItems) {
    if (err) {
      callback(err);
    } else {
      userItems = xtend({
        directedFeed: 'false',
        mediaOn: 'true',
        charLimit: 'false',
        highContrast: 'false'
      }, userItems || {});
      callback(null, userItems);
    }
  });
}

exports.getSettings = function(req, client, callback) {
  var user = utils.getUser(req);
  var userId = user.id;

  this.getLocalSettings(req, client, function(err, userItems) {
    if (err) {
      callback(err);
    } else {
      appnet.getUser(req, user.username, function(err, user) {
        if(err) {
          callback(err);
        }
        else {
          user = user.data;
          userItems.username = user.username;
          userItems.name = user.name;
          userItems.locale = user.locale;
          userItems.timezone = user.timezone;
          userItems.description = markdownToEntities.stringify(user.description);
          userItems.languages = languages;
          userItems.toggleSettings = toggleSettings;
          callback(null, userItems);
        }
      });
    }
  });
};

exports.saveSettings = function(req, client, callback) {
  var self = this;
  var user = utils.getUser(req);

  var settings = req.body.user;
  var localSettings = {};
  // All the local settings are currently toggle, but that might not stay true.
  for(var i = 0; i < toggleSettings.length; i++) {
    localSettings[toggleSettings[i].name] = settings[toggleSettings[i].name];
  }

  client.hmset('settings:' + user.id, localSettings, function(err, resp) {
    if (err) {
      callback(err);
    } else {
      var userInfo = {
        name: settings.name,
        locale: settings.locale,
        timezone: settings.timezone,
        description: markdownToEntities.parse(settings.description)
      };
      appnet.putUser(req, user.username, userInfo, function(err, resp) {
        if (err) {
          callback(err);
        } else {
          self.getSettings(req, client, callback);
        }
      });
    }
  });
};
