/*
 * Copyright 2013 Sarah Vessels
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-40846020-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

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
    if (color_data) {
      var colors = Object.keys(color_data);
      this.display_colors(colors);
      this.describe_colors(color_data);
      this.set_create_link(colors);
    }
  },

  on_popup_opened: function() {
    var me = this;
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendRequest(
        tab.id,
        {greeting: 'popup_opened', tab_id: tab.id},
        function(color_data) {
          me.on_colors_extracted(color_data);
        }
      );
    });
  }
};

document.addEventListener('DOMContentLoaded', function() {
  extractor_popup.on_popup_opened();
});
