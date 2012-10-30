'use strict';

define(['jquery'],
  function ($) {
    $.fn.getCursorPosition = function() {
      var el = $(this).get(0);
      var pos = 0;
      if('selectionStart' in el) {
        pos = el.selectionStart;
      } else if ('selection' in document) {
        el.focus();
        var Sel = document.selection.createRange();
        var SelLength = document.selection.createRange().text.length;
        Sel.moveStart('character', -el.value.length);
        pos = Sel.text.length - SelLength;
      }
      return pos;
    }

    $.fn.moveCursorToEnd = function() {
      var el = $(this).get(0);
      if (typeof el.selectionStart == 'number') {
        el.selectionStart = el.selectionEnd = el.value.length;
      } else if (typeof el.createTextRange != 'undefined') {
        el.focus();
        var range = el.createTextRange();
        range.collapse(false);
        range.select();
      }
    }
});
