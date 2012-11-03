// markdown can have markdown [test](url) links, or bare URLs.  Anything else will be ignored and remain text.  Only link entities are set; that's all that's needed to post to the app.net API.
exports.parse = function(markdown) {
  // Markdown bracket regex based on http://stackoverflow.com/a/9268827
  var markdownLinkRegex = /\[([^\]]+)\]\((\S+(?=\)))\)/;

  var bareUrlRegex = /((?:http|https|ftp|scp|sftp):\/\/)?[A-Z0-9-_]+(?:\.{1}[A-Z0-9-_]+)?\.{1}[A-Z]{2,4}(?::\d+)?(?:\S+)?/gi;

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
  // Has to be called repeatedly, since if done globally, it will provide the original index (before earlier replacements)
  do {
    var oldText = text;
    text = oldText.replace(markdownLinkRegex, handleReplacement);
  } while(text != oldText);

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
