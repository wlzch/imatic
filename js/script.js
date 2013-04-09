$(function() {
    var $canvas = $('.canvas');
    var $canvasInner = $('.canvas-inner');
    var $canvasHeader = $('.canvas-outer h3');
    $('#file').change(function(e) {
        var file = e.target.files[0];
        loadImage(file, function(canvas) {
            var width = canvas.width;
            var height = canvas.height;
            $canvasHeader.text(file.name.split('.')[0]);
            $canvas.width(width);
            $canvas.height(height);
            $canvasInner.css('line-height', height+'px');
            $canvas.addClass('canvas-active');
            if ($canvasInner.has('canvas')) {
                $canvasInner.find('canvas').remove();
            }
            $canvasInner.append(canvas);
        }, {canvas: true, maxWidth: 800, maxHeight: 800});
    });
    $('#open').click(function() {
        $('#file').click();
    });
});
