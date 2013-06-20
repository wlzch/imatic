$(function() {
  var Canvas = {}, selectedArea, areaSelect;
  Canvas.ctx = undefined;
  Canvas.getCanvas = function() {
    return this.ctx.canvas;
  };
  Canvas.getImageData = function() {
    var canvas = this.getCanvas();
    if (selectedArea) {
      return this.ctx.getImageData(selectedArea.x1, selectedArea.y1, selectedArea.width, selectedArea.height);
    }
    return this.ctx.getImageData(0, 0, canvas.width, canvas.height);
  };
  Canvas.runFilter = function(filter) {
    var args = [this.getImageData()];
    for (var i = 2; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    var data = filter.apply(this, args);
    if (selectedArea) {
      this.ctx.putImageData(data, selectedArea.x1, selectedArea.y1);
    } else {
      this.ctx.putImageData(data, 0, 0);
    }
  };
  Canvas.crop = function() {
    if (selectedArea) {
      var canvas = this.getCanvas();
      var data = this.ctx.getImageData(selectedArea.x1, selectedArea.y1, selectedArea.width, selectedArea.height);
      this.ctx.putImageData(this.ctx.createImageData(canvas.width, canvas.height), 0, 0);
      this.ctx.putImageData(data, selectedArea.x1, selectedArea.y1);
    }
  }
  Canvas.resize = function(width, height) {
    $('canvas').css({width: width, height: height});
  };
  Canvas.utils = {};
  Canvas.utils.convertCoordsToIndex = function(imageData, x, y) {
    if (x < 0 || x > imageData.width || y < 0 || y > imageData.height) {
      throw Error('Coords not available');
    }

    return (y * imageData.width * 4) + (x * 4);
  };
  Canvas.utils.getPixel = function(imageData, x, y) {
    var pos, data;
    data = imageData.data;
    try {
      pos = Canvas.utils.convertCoordsToIndex(imageData, x, y);
      return [
        data[pos],
        data[pos + 1],
        data[pos + 2],
        data[pos + 3]
      ];
    } catch (e) {
      return false;
    }
  };
  Canvas.utils.setPixel = function(imageData, x, y, value) {
    var data, pos;
    data = imageData.data;
    try {
      pos = Canvas.utils.convertCoordsToIndex(imageData, x, y);
    } catch (e) {
      return false;
    }
    data[pos] = value[0];
    data[pos + 1] = value[1];
    data[pos + 2] = value[2];
    data[pos + 3] = value[3];
  };

  Canvas.filters = {};
  Canvas.filters.grayscale = function(imageData) {
    var data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
      var r = data[i];
      var g = data[i + 1];
      var b = data[i + 2];
      var v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      data[i] = data[i + 1] = data[i + 2] = v;
    }

    return imageData;
  };
  Canvas.filters.flipH = function(imageData) {
    var newImageData, x, y, value;

    newImageData = this.ctx.createImageData(imageData.width, imageData.height);

    for (x = 0, width = imageData.width; x < width; ++x) {
      for (y = 0, height = imageData.height; y < height; ++y) {
        value = Canvas.utils.getPixel(imageData, width - 1 - x, y);
        if (value) {
          Canvas.utils.setPixel(newImageData, x, y, value);//(x + ((width - x) - 1)), y, value);
        }
      }
    }
    return newImageData;
  };
  Canvas.filters.flipV = function(imageData) {
    var newImageData, x, y, value;

    newImageData = this.ctx.createImageData(imageData.width, imageData.height);

    for (x = 0, width = imageData.width; x < width; ++x) {
      for (y = 0, height = imageData.height; y < height; ++y) {
        value = Canvas.utils.getPixel(imageData, x, height - 1 - y);
        if (value) {
          Canvas.utils.setPixel(newImageData, x, y, value);
        }
      }
    }
    return newImageData;
  };
  Canvas.filters.sepia = function(imageData) {
    var data, d, r, g, b, i;
    data = imageData.data;
    for (i = 0; i < data.length; i += 4) {
      var d = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      var r = (d + 39);
      var g = (d + 14);
      var b = (d - 36);
      if (r < 0) r = 0; if (r > 255) r = 255;
      if (g < 0) g = 0; if (g > 255) g = 255;
      if (b < 0) b = 0; if (b > 255) b = 255;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    return imageData;
  };
  Canvas.filters.brightness = function(imageData) {
    var data = imageData.data;
    var brightness = 128;
    for (var i = 0; i < data.length; i += 4) {
      var r = (data[i] + brightness);
      var g = (data[i + 1] + brightness);
      var b = (data[i + 2] + brightness);
      if (r < 0) r = 0; if (r > 255) r = 255;
      if (g < 0) g = 0; if (g > 255) g = 255;
      if (b < 0) b = 0; if (b > 255) b = 255;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    return imageData;
  };

  Canvas.filters.blur = function(imageData, radius) {
    var newImageData, x, y, p, total, value;
    var pixelsCount, pixel, surroundingPixels, surroundingPixelsLength;
    newImageData = this.ctx.createImageData(imageData.width, imageData.height);
    radius = radius || 2;
    surroundingPixelsLength = 8;

    for (x = 0, width = imageData.width; x < width; ++x) {
      for (y = 0, height = imageData.height; y < height; ++y) {
        pixelsCount = 0;
        total = [0, 0, 0, 0];//0 => opacity, 1 => red, 2 => green, 3 => blue
        surroundingPixels = [
          [x - 1, y - 1], // Top left.
          [x, y - 1], // Top middle.
          [x + 1, y - 1], // Top right.
          [x - 1, y], // Middle left.
          [x * 1, y], // Middle right.
          [x - 1, y + 1], // Bottom left.
          [x, y + 1], // Bottom middle.
          [x + 1, y + 1]  // Bottom right.
        ];
        for (p = 0; p < surroundingPixelsLength; ++p) {
          pixel = Canvas.utils.getPixel(imageData, surroundingPixels[p][0], surroundingPixels[p][1]);
          if (pixel) {
            total[0] += pixel[0];
            total[1] += pixel[1];
            total[2] += pixel[2];
            total[3] += pixel[3];
            ++pixelsCount;
          }
        }
        value = [total[0] / pixelsCount, total[1] / pixelsCount, total[2] / pixelsCount, total[3] / pixelsCount];
        Canvas.utils.setPixel(newImageData, x, y, value);
      }
    }

    return newImageData;
  };

  Canvas.filters.warp = function(imageData, factor) {
    var newImageData = this.ctx.createImageData(imageData.width, imageData.height);
    var width = imageData.width, height = imageData.height;
    var w = width / 2, h = height / 2;
    var _twirl = function(px, py) {
      var x = px - w;
      var y = py - h;
      var r = Math.sqrt(x*x + y*y);
      if (r > w) return {x: px, y: py};
      var a = Math.atan2(y, x);
      a += 1 - r / w;
      var dx = Math.cos(a) * r;
      var dy = Math.sin(a) * r;
      return {
        x: dx + w,
        y: dy + h
      }
    }
    var colorat = function(imageData, x, y, channel) {
      return imageData.data[(x+y*height)*4+channel];
    }
    var map = [];
    for (var x = 0; x < width; ++x) {
      for (var y = 0; y < height; ++y) {
        var t = _twirl(x, y);
        map[(x+y*height)*2+0] = Math.max(Math.min(t.x, width - 1), 0);
        map[(x+y*height)*2+1] = Math.max(Math.min(t.y, height - 1), 0);
      }
    }
    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++) {
        var u = map[(i+j*height)*2];
        var v = map[(i+j*height)*2+1];
        var x = Math.floor(u);
        var y = Math.floor(v);
        var kx = u-x;
        var ky = v-y;
        for (var c=0; c<4; c++) {
            newImageData.data[(i+j*height)*4+c] =
                (colorat(imageData, x,y  ,c)*(1-kx) + colorat(imageData, x+1,y  ,c)*kx) * (1-ky) +
                (colorat(imageData, x,y+1,c)*(1-kx) + colorat(imageData, x+1,y+1,c)*kx) * (ky);
        }
      }
    }

    return newImageData;
  }

  var $canvasContainer = $('.canvas');
  var $canvasInner = $('.canvas-inner');
  var $canvasHeader = $('.canvas-outer h3');
  var ctx = undefined;
  $('#file').change(function(e) {
    var file = e.target.files[0];
    loadImage(file, function(canvas) {
      if (areaSelect) areaSelect.cancelSelection();
      var width = canvas.width;
      var height = canvas.height;
      $canvasHeader.text(file.name.split('.')[0]);
      $canvasContainer.width(width);
      $canvasContainer.height(height);
      $canvasInner.css('line-height', height + 'px');
      $canvasContainer.addClass('canvas-active');
      if ($canvasInner.has('canvas')) {
        $canvasInner.find('canvas').remove();
      }
      $canvasInner.append(canvas);
      Canvas.ctx = canvas.getContext('2d');
      var selectEnd = function(cvs, selection) {
        if (selection.width < 5) {
          selectedArea = null;
        } else {
          selectedArea = selection;
        }
      }
      areaSelect = $('canvas').imgAreaSelect({onSelectEnd: selectEnd, instance: true});
    }, {canvas: true, maxWidth: 800, maxHeight: 800, minWidth: 200, minHeight: 200});
  });

  $('#open').click(function() {
    $('#file').click();
  });
  $('#grayscale').click(function() {
    Canvas.runFilter(Canvas.filters.grayscale);
  });
  $('#sepia').click(function() {
    Canvas.runFilter(Canvas.filters.sepia);
  });
  $('#blur').click(function() {
    Canvas.runFilter(Canvas.filters.blur);
  });
  $('#flipH').click(function() {
    Canvas.runFilter(Canvas.filters.flipH);
  });
  $('#flipV').click(function() {
    Canvas.runFilter(Canvas.filters.flipV);
  });
  $('#brightness').click(function() {
    Canvas.runFilter(Canvas.filters.brightness);
  });
  $('#warp').click(function() {
    Canvas.runFilter(Canvas.filters.warp);
  });
  $('#crop').click(function() {
    Canvas.crop();
  });
  $('#resize').click(function() {
    var size = prompt("Enter width,height");
    if (size != null && size != "") {
      size = size.split(',');
      Canvas.resize(size[0], size[1]);
    }
  });
});
