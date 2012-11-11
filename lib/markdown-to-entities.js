'use strict';

// markdown can have markdown [test](url) links, or bare URLs.  Anything else will be ignored and remain text.  Only link entities are set; that's all that's needed to post to the app.net API.
exports.parse = function(markdown) {
  // Markdown bracket regex based on http://stackoverflow.com/a/9268827
  var markdownLinkRegex = /\[([^\]]+)\]\((\S+(?=\)))\)/;

  // Regex pulled from https://github.com/chriso/node-validator
  var bareUrlRegex = /(?:(?:ht|f)tp(?:s?)\:\/\/|~\/|\/)?(?:\w+:\w+@)?(localhost|(?:(?:[-\w\d{1-3}]+\.)+(?:com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|edu|co\.uk|ac\.uk|it|fr|tv|museum|asia|local|travel|[a-z]{2}))|((\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)(\.(\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)){3}))(?::[\d]{1,5})?(?:(?:(?:\/(?:[-\w~!$+|.,="'\(\)_\*:]|%[a-f\d]{2})+)+|\/)+|\?|#)?(?:(?:\?(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)(?:&(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)*)*(?:#(?:[-\w~!$ |\/.,*:;=]|%[a-f\d]{2})*)?$/ig;

  var links = [];
  var text = markdown;

  function handleReplacement(_, anchor, url, pos) {
    links.push({
      pos: pos,
      len: anchor.length,
      url: url
    });

    return anchor;
  }

  var oldText;

  // Has to be called repeatedly, since if done globally, it will provide the original index (before earlier replacements)
  do {
    oldText = text;
    text = oldText.replace(markdownLinkRegex, handleReplacement);
  } while(text !== oldText);

  var match;
  while((match = bareUrlRegex.exec(text))) {
    var url = match[0];
    var len = url.length;
    if(match[1] === undefined) {
      url = 'http://' + url;
    }

    links.push({
      pos: match.index,
      len: len,
      url: url
    });
  }

  return {
    text: text,
    entities: {
      links: links
    }
  };
};
