$(function() {
    var Canvas = {};
    Canvas.ctx = undefined;
    Canvas.getCanvas = function() {
        return this.ctx.canvas;
    };
    Canvas.getImageData = function() {
        var canvas = this.getCanvas()
        return this.ctx.getImageData(0, 0, canvas.width, canvas.height);
    };
    Canvas.runFilter = function(filter) {
        var args = [this.getImageData()];
        for (var i=2; i<arguments.length; i++) {
            args.push(arguments[i]);
        }
        var data = filter.apply(null, args);
        this.ctx.putImageData(data, 0, 0);
    }
    Canvas.filters = {};
    Canvas.filters.grayscale = function(imageData) {
        var data = imageData.data;
        for (var i=0; i < data.length; i+=4) {
            var r = data[i];
            var g = data[i+1];
            var b = data[i+2];
            var v = 0.2126*r + 0.7152*g + 0.0722*b;
            data[i] = data[i+1] = data[i+2] = v;
        }

        return imageData;
    }
    Canvas.filters.sepia = function(imageData) {
        var data = imageData.data;
        for (var i=0; i < data.length; i+=4) {
            var d = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
            var r = (d + 39);
            var g = (d + 14);
            var b = (d - 36);
            if (r < 0) r = 0; if (r > 255) r = 255;
            if (g < 0) g = 0; if (g > 255) g = 255;
            if (b < 0) b = 0; if (b > 255) b = 255;
            data[i] = r;
            data[i+1] = g;
            data[i+2] = b;
        }

        return imageData;
    };

    var $canvasContainer = $('.canvas');
    var $canvasInner = $('.canvas-inner');
    var $canvasHeader = $('.canvas-outer h3');
    var ctx = undefined;
    $('#file').change(function(e) {
        var file = e.target.files[0];
        loadImage(file, function(canvas) {
            var width = canvas.width;
            var height = canvas.height;
            $canvasHeader.text(file.name.split('.')[0]);
            $canvasContainer.width(width);
            $canvasContainer.height(height);
            $canvasInner.css('line-height', height+'px');
            $canvasContainer.addClass('canvas-active');
            if ($canvasInner.has('canvas')) {
                $canvasInner.find('canvas').remove();
            }
            $canvasInner.append(canvas);
            Canvas.ctx = canvas.getContext('2d');
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
});
