var colour_extractor = {
  palette_size: 5,

  color_piece_to_hex: function(piece) {
    var hex = piece.toString(16);
    return hex.length == 1 ? '0' + hex : hex;
  },

  split_rgb_code: function(rgb_code) {
    var parts = rgb_code.split(', ');
    var r = parseInt(parts[0].split('(')[1], 10);
    var g = parseInt(parts[1], 10);
    var b = parseInt(parts[2].split(')')[0], 10);
    return [r, g, b];
  },

  rgb2hex: function(rgb_code) {
    var parts = this.split_rgb_code(rgb_code);
    var r = parts[0], g = parts[1], b = parts[2];
    return '#' + this.color_piece_to_hex(r) + this.color_piece_to_hex(g) +
           this.color_piece_to_hex(b);
  },

  has_color: function(rgb_code) {
    if (rgb_code.substring(0, 4) == 'rgb(') {
      return true;
    }
    return rgb_code.substring(0, 5) == 'rgba(' &&
           rgb_code.substring(rgb_code.length - 3) != ' 0)';
  },

  get_largest_color_areas: function(color_areas) {
    var tuples = [];
    for (var color in color_areas) {
      tuples.push([color, color_areas[color]]);
    }
    tuples.sort(function(a, b) {
      a = a[1];
      b = b[1];
      return a < b ? 1 : (a > b ? -1 : 0);
    });
    var top_colors = [];
    var limit = Math.min(tuples.length, this.palette_size);
    for (var i=0; i<limit; i++) {
      var color = tuples[i][0];
      top_colors.push(this.rgb2hex(color));
    }
    return top_colors;
  },

  extract_colors: function(callback) {
    var me = this;
    var color_areas = {};
    var add_to_hash = function(key, value) {
      if (color_areas.hasOwnProperty(key)) {
        color_areas[key] = color_areas[key].concat([value]);
      } else {
        color_areas[key] = [value];
      }
    };
    $('*').filter(':visible').each(function() {
      var el = $(this);
      var area = el.width() * el.height();
      var bg_color = el.css('background-color');
      if (me.has_color(bg_color)) {
        add_to_hash(bg_color, area);
      }
    });
    callback(this.get_largest_color_areas(color_areas));
  },

  on_popup_opened: function(callback) {
    this.extract_colors(callback);
  }
};

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (request.greeting == 'popup_opened') {
    colour_extractor.on_popup_opened(function(colors) {
      console.log(colors);
      sendResponse(colors);
    });
  }
});
