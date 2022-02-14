'use strict';

// Return markdown given pnut.io object, generally either a post or user description.  Only text and entities.links are currently used
exports.stringify = function(adnObject) {
  var markdown = adnObject.text;
  var links = adnObject.entities.links;
  var link, len, remaining;
  links.sort(function(l1, l2) {
    return l1.pos - l2.pos;
  });

  for(var i = links.length - 1; i >= 0; i--) {
    link = links[i];

    // We keep bare URLs bare.
    if(link.text !== link.url) {
      len = link.amended_len || link.len; // amended_len is omitted when there is no anti-phishing protection
      remaining = markdown.substring(link.pos + len);
      markdown = markdown.substring(0, link.pos) + '[' + link.text + '](' + link.url + ')' + remaining;
    }
  }

  return markdown;
};
