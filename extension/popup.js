var extractor_popup = {
  palette_size: 5,

  display_colors: function(colors) {
    for (var i=0; i<colors.length; i++) {
      $('#color' + (i+1)).css('background-color', '#' + colors[i]);
    }
  },

  set_create_link: function(colors) {
    var url = 'http://www.colourlovers.com/palettes/add?colors=' +
              colors.join(',');
    $('#create-palette').unbind('click').click(function() {
      chrome.tabs.create({url: url});
      return false;
    }).blur();
  },

  describe_color: function(color_data, index) {
    var container = $('#color' + index + '-data');
    var url;
    if (color_data.url) {
      url = color_data.url;
    } else {
      url = 'http://www.colourlovers.com/colors/add?hex=' + color_data.hex;
    }
    var open_color_url = function() {
      chrome.tabs.create({url: url});
      return false;
    };
    var color = '#' + color_data.hex;
    $('a.color-swatch', container).css('background-color', color).
                                   unbind('click').click(open_color_url);
    if (color_data.title) {
      $('h3 a', container).text(color_data.title).unbind('click').
                           click(open_color_url);
    } else {
      $('h3', container).hide();
    }
    if (color_data.user_name) {
      $('h4 span', container).text(color_data.user_name);
    } else {
      $('h4', container).hide();
    }
    $('.hex span', container).text(color);
  },

  describe_colors: function(color_data) {
    var index = 1;
    for (var color in color_data) {
      this.describe_color(color_data[color], index);
      index++;
    }
    while (index <= this.palette_size) {
      $('#color' + index + '-data').hide();
      index++;
    }
    $('#color-data-wrapper').fadeIn();
  },

  on_colors_extracted: function(color_data) {
    var colors = Object.keys(color_data);
    this.display_colors(colors);
    this.describe_colors(color_data);
    this.set_create_link(colors);
  },

  on_popup_opened: function() {
  }
};

document.addEventListener('DOMContentLoaded', function() {
  extractor_popup.on_popup_opened();
  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.sendRequest(
      tab.id,
      {greeting: 'popup_opened'},
      function(color_data) {
        extractor_popup.on_colors_extracted(color_data);
      }
    );
  });
});
