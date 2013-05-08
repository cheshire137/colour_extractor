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

  // See http://stackoverflow.com/a/3732187/38743
  get_hue: function(rgb_code) {
    return this.rgb2hsl(rgb_code)[0] * 360;
  },

  // See http://stackoverflow.com/a/3732187/38743
  rgb2hsl: function(rgb_code) {
    var parts = this.split_rgb_code(rgb_code);
    var r = parts[0], g = parts[1], b = parts[2];
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max == min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h, s, l];
  },

  rgb2hex: function(rgb_code) {
    var parts = this.split_rgb_code(rgb_code);
    var r = parts[0], g = parts[1], b = parts[2];
    return this.color_piece_to_hex(r) + this.color_piece_to_hex(g) +
           this.color_piece_to_hex(b);
  },

  has_color: function(rgb_code) {
    if (rgb_code.substring(0, 4) == 'rgb(') {
      return true;
    }
    return rgb_code.substring(0, 5) == 'rgba(' &&
           rgb_code.substring(rgb_code.length - 3) != ' 0)';
  },

  // See http://stackoverflow.com/a/3118280/38743
  y: function(rgb_code) {
    // Black: 0
    // White: ~1
    var split_code = this.split_rgb_code(rgb_code);
    var r = split_code[0], g = split_code[1], b = split_code[2];
    r = Math.pow(r / 255, 2.2);
    g = Math.pow(g / 255, 2.2);
    b = Math.pow(b / 255, 2.2);
    return 0.2126*r + 0.7151*g + 0.0721*b;
  },

  get_color_ratio: function(rgb_code1, rgb_code2) {
    // Ratio of white to black: ~21
    // Ratio of a color to itself: 1
    return (this.y(rgb_code1) + 0.05) / (this.y(rgb_code2) + 0.05);
  },

  get_color_weight_data: function(color_areas) {
    var weighted_colors = {};
    var colors = [];
    for (var color in color_areas) {
      weighted_colors[color] = {area: color_areas[color]};
      colors.push(color);
    }
    var max_ratios = this.get_max_color_ratios(colors);
    for (var color in max_ratios) {
      weighted_colors[color].max_ratio = max_ratios[color];
    }
    console.log(weighted_colors);
    return weighted_colors;
  },

  get_max_color_ratios: function(colors) {
    var ratios = {};
    var add_ratio = function(color, ratio) {
      if (ratios.hasOwnProperty(color)) {
        if (ratios[color] < ratio) {
          ratios[color] = ratio;
        }
      } else {
        ratios[color] = ratio;
      }
    };
    for (var i=0; i<colors.length; i++) {
      var color1 = colors[i];
      for (var j=0; j<colors.length; j++) {
        var color2 = colors[j];
        var ratio = this.get_color_ratio(color1, color2);
        add_ratio(color1, ratio);
        add_ratio(color2, ratio);
      }
    }
    return ratios;
  },

  get_color_weight: function(data) {
    console.log(data);
    return data.area * data.max_ratio;
  },

  get_colors_sorted_by_weight: function(data) {
    var tuples = [];
    for (var color in data) {
      var color_data = data[color];
      tuples.push([color, color_data.area, color_data.max_ratio]);
    }
    var me = this;
    tuples.sort(function(a, b) {
      a = me.get_color_weight({area: a[1], max_ratio: a[2]});
      b = me.get_color_weight({area: b[1], max_ratio: b[2]});
      return a < b ? 1 : (a > b ? -1 : 0);
    });
    var sorted_colors = [];
    for (var i=0; i<tuples.length; i++) {
      sorted_colors.push(tuples[i][0]);
    }
    return sorted_colors;
  },

  get_top_colors: function(colors) {
    var top_colors = [];
    var i = 0;
    while (top_colors.length < this.palette_size && i < colors.length) {
      top_colors.push(colors[i]);
      i++;
    }
    console.log(top_colors);
    return top_colors;
  },

  get_hex_codes: function(colors) {
    var hex_codes = [];
    for (var i=0; i<colors.length; i++) {
      hex_codes.push(this.rgb2hex(colors[i]));
    }
    console.log(hex_codes);
    return hex_codes;
  },

  extract_colors: function(callback) {
    var me = this;
    var color_areas = {};
    var add_to_hash = function(key, value) {
      if (color_areas.hasOwnProperty(key)) {
        color_areas[key] = color_areas[key] + value;
      } else {
        color_areas[key] = value;
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
    var color_weight_data = this.get_color_weight_data(color_areas);
    var sorted_colors = this.get_colors_sorted_by_weight(color_weight_data);
    var top_colors = this.get_top_colors(sorted_colors);
    return this.get_hex_codes(top_colors);
  },

  get_cl_color_url: function(color) {
    return 'http://www.colourlovers.com/api/color/' + color + '?format=json';
  },

  lookup_color: function(color, callback) {
    var url = this.get_cl_color_url(color);
    $.getJSON(url, function(data, status, xhr) {
      if (data.length < 1) {
        callback({hex: color});
      } else {
        data = data[0];
        callback({title: data.title, id: data.id, user_name: data.userName,
                  hex: data.hex, url: data.url});
      }
    }).error(function() {
      callback({hex: color});
    });
  },

  lookup_colors: function(colors, callback) {
    var colors_data = {};
    var num_colors = colors.length;
    for (var i=0; i<num_colors; i++) {
      this.lookup_color(colors[i], function(color_data) {
        colors_data[color_data.hex] = color_data;
        if (Object.keys(colors_data).length == num_colors) {
          callback(colors_data);
        }
      });
    }
  },

  on_popup_opened: function(callback) {
    var colors = this.extract_colors();
    this.lookup_colors(colors, function(color_data) {
      callback(color_data);
    });
  }
};

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (request.greeting == 'popup_opened') {
    colour_extractor.on_popup_opened(function(color_data) {
      sendResponse(color_data);
    });
  }
});
