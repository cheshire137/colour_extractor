var extractor_popup = {
  display_colors: function(colors) {
    for (var i=0; i<colors.length; i++) {
      $('#color' + (i+1)).css('background-color', colors[i]);
    }
  },

  strip_pound_sign: function(hex_codes) {
    var stripped = [];
    for (var i=0; i<hex_codes.length; i++) {
      stripped.push(hex_codes[i].replace(/^#/, ''));
    }
    return stripped;
  },

  set_create_link: function(colors) {
    var url = 'http://www.colourlovers.com/palettes/add?colors=' +
              this.strip_pound_sign(colors).join(',');
    $('#create-palette').unbind('click').click(function() {
      chrome.tabs.create({url: url});
      return false;
    });
  },

  on_colors_extracted: function(colors) {
    this.display_colors(colors);
    this.set_create_link(colors);
  }
};

document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.sendRequest(
      tab.id,
      {greeting: 'popup_opened'},
      function(colors) {
        extractor_popup.on_colors_extracted(colors);
      }
    );
  });
});
