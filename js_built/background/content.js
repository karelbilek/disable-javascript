'use strict';

function htmlDecode(input) {
  var doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
}

(function() {
  var tags = document.getElementsByTagName('noscript');

  for (var i = 0; i < tags.length; i++) {
    if (tags[i].firstChild) {
      var newDiv = document.createElement('div');
      var a = tags[i].getAttributeNames();

      // Copy over <noscript> content.
      newDiv.innerHTML = htmlDecode(tags[i].innerHTML);

      // Copy over <noscript> attributes.
      for (var k = 0; k < a.length; k++) {
        newDiv.setAttribute(a[k], tags[i].getAttribute(a[k]));
      }

      tags[i].parentNode.replaceChild(newDiv, tags[i]);
    }
  }
})();
