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

var colour_extractor = {
  palette_size: 5,

  // See http://stackoverflow.com/a/2541680/38743
  get_average_image_rgb: function(img_url, callback) {
    var block_size = 5, // only visit every 5 pixels
        default_rgb = 'rgba(0, 0, 0, 0)', // for non-supporting envs
        canvas = document.createElement('canvas'),
        context = canvas.getContext && canvas.getContext('2d'),
        data, i = -4, length, width, height,
        rgb = {r: 0, g: 0, b: 0},
        count = 0;
    if (!context) {
      callback(default_rgb);
      return;
    }
    var img = new Image();
    img.onload = function() {
      width = canvas.width = img.naturalWidth;
      height = canvas.height = img.naturalHeight;
      context.drawImage(img, 0, 0);
      try {
        data = context.getImageData(0, 0, width, height);
      } catch(e) {
        callback(default_rgb);
        return;
      }
      length = data.data.length;
      while ((i += block_size * 4) < length) {
        ++count;
        rgb.r += data.data[i];
        rgb.g += data.data[i+1];
        rgb.b += data.data[i+2];
      }
      // ~~ used to floor values
      rgb.r = ~~(rgb.r/count);
      rgb.g = ~~(rgb.g/count);
      rgb.b = ~~(rgb.b/count);
      var rgb_code = 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
      callback(rgb_code);
    };
    img.src = img_url;
  },

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

  get_hue_percent: function(rgb_code) {
    var hue = this.get_hue(rgb_code);
    return Math.round((hue / 360) * 100);
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

  get_color_weight_data: function(color_area_positions) {
    var weighted_colors = {};
    var colors = [];
    for (var color in color_area_positions) {
      var area = color_area_positions[color].area;
      var position = color_area_positions[color].position;
      weighted_colors[color] = {area: area, position: position,
                                hue: this.get_hue_percent(color),
                                color: color};
      colors.push(color);
    }
    var max_ratios = this.get_max_color_ratios(colors);
    for (var color in max_ratios) {
      weighted_colors[color].max_ratio = max_ratios[color];
      console.log(weighted_colors[color]);
    }
    return weighted_colors;
  },

  get_max_color_ratios: function(colors) {
    var ratios = {};
    var add_ratio = function(color, ratio) {
      if (ratios.hasOwnProperty(color)) {
        if (ratios[color] == 100) {
          ratios[color] = ratio;
        } else {
          ratios[color] = Math.round(ratio, ratios[color]);
        }
      } else {
        ratios[color] = 100;
      }
    };
    var mid_point = Math.floor(colors.length / 2);
    for (var i=0; i<mid_point; i++) {
      var color1 = colors[i];
      for (var j=mid_point; j<colors.length; j++) {
        var color2 = colors[j];
        var ratio = this.get_color_ratio(color1, color2);
        // ratio 1  --> same color
        // ratio 21 --> opposite colors
        var ratio_pct = 100 - Math.round(((21 - ratio) / 21) * 100);
        add_ratio(color1, ratio_pct);
        add_ratio(color2, ratio_pct);
      }
    }
    return ratios;
  },

  get_color_weight: function(data) {
    return 0.4*data.area + 0*data.max_ratio + 0.3*data.hue +
           0.3*data.position;
  },

  get_colors_sorted_by_weight: function(data) {
    var tuples = [];
    for (var color in data) {
      var color_data = data[color];
      tuples.push([color, color_data]);
    }
    var me = this;
    tuples.sort(function(a, b) {
      a = me.get_color_weight(a[1]);
      b = me.get_color_weight(b[1]);
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
    return top_colors;
  },

  get_hex_codes: function(colors) {
    var hex_codes = [];
    for (var i=0; i<colors.length; i++) {
      hex_codes.push(this.rgb2hex(colors[i]));
    }
    return hex_codes;
  },

  get_gradient_rgb_codes: function(el) {
    var background = el.css('background');
    var grad_str = 'gradient(';
    var index = background.indexOf(grad_str);
    if (index < 0) {
      return false;
    }
    var pieces = background.substr(index + grad_str.length).split(')');
    var rgb_codes = [];
    for (var i=0; i<pieces.length; i++) {
      var index = pieces[i].indexOf('rgb(');
      if (index < 0) {
        continue;
      }
      rgb_codes.push(pieces[i].substr(index) + ')');
    }
    return rgb_codes;
  },

  get_color_area_positions: function(callback) {
    var results = {};
    var add_to_hash = function(color, area, from_top) {
      if (results.hasOwnProperty(color)) {
        var prev_area = results[color].area;
        results[color] = {area: prev_area + area, position: from_top};
      } else {
        results[color] = {area: area, position: from_top};
      }
    };
    var me = this;
    var max_area = 0;
    var max_from_top = 0;
    var elements = $('*').filter(':visible');
    var num_elements = elements.length;
    var num_processed = 0;
    elements.each(function() {
      var el = $(this);
      var area = el.width() * el.height();
      max_area = Math.max(area, max_area);
      var from_top = el.position().top;
      max_from_top = Math.max(from_top, max_from_top);
      var background = el.css('background');
      me.get_image_color(
        background,
        function(img_color, is_last) {
          if (me.has_color(img_color)) {
            add_to_hash(img_color, area, from_top);
          } else {
            var bg_color = el.css('background-color');
            if (me.has_color(bg_color)) {
              add_to_hash(bg_color, area, from_top);
            }
            var gradient_colors = me.get_gradient_rgb_codes(el);
            for (var i=0; i<gradient_colors.length; i++) {
              add_to_hash(gradient_colors[i], area, from_top);
            }
          }
          num_processed++;
          if (num_processed == num_elements) {
            callback(me.pixels2percentages(results, max_area, max_from_top));
          }
        }
      );
    });
  },

  get_image_color: function(background, callback) {
    var index = background.indexOf('url(');
    if (index === -1) {
      callback('rgba(0, 0, 0, 0)');
      return;
    }
    var img_url = background.substr(index + 'url('.length).split(')')[0];
    this.get_average_image_rgb(img_url, function(img_color) {
      callback(img_color);
    });
  },

  pixels2percentages: function(results, max_area, max_from_top) {
    for (var color in results) {
      // Convert raw pixels to a percentage of the page
      var area = results[color].area;
      var area_pct = Math.round((area / max_area) * 100)
      var position = results[color].position;
      // 0 = 100%
      // 5000 = 0%
      // element near top:    5
      // element near bottom: 3500
      // max from top:        5000
      var position_pct = Math.round(((max_from_top - position) / max_from_top) *
                                    100);
      results[color] = {area: area_pct, position: position_pct};
    }
    return results;
  },

  extract_colors: function(callback) {
    var me = this;
    this.get_color_area_positions(function(color_area_positions) {
      var color_weight_data = me.get_color_weight_data(color_area_positions);
      var sorted_colors = me.get_colors_sorted_by_weight(color_weight_data);
      var top_colors = me.get_top_colors(sorted_colors);
      var hex_codes = me.get_hex_codes(top_colors);
      callback(hex_codes);
    });
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

  process_tab: function(tab_id, callback) {
    chrome.storage.local.get('colour_extractor_data', function(data) {
      data = data.colour_extractor_data || {};
      if (data.hasOwnProperty(tab_id)) {
        return;
      }
      data[tab_id] = 'processing';
      chrome.storage.local.set({'colour_extractor_data': data}, function() {
        callback();
      });
    });
  },

  finished_processing_tab: function(tab_id) {
    chrome.storage.local.get('colour_extractor_data', function(data) {
      data = data.colour_extractor_data || {};
      delete data[tab_id];
      chrome.storage.local.set({'colour_extractor_data': data}, function() {
        // no-op
      });
    });
  },

  on_popup_opened: function(tab_id, callback) {
    var me = this;
    // this.process_tab(tab_id, function() {
      me.extract_colors(function(colors) {
        me.lookup_colors(colors, function(color_data) {
          // me.finished_processing_tab(tab_id);
          callback(color_data);
        });
      });
    // });
  }
};

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (request.greeting == 'popup_opened') {
    colour_extractor.on_popup_opened(request.tab_id, function(color_data) {
      sendResponse(color_data);
    });
  }
});
