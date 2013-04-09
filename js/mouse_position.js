// Add mousePosition on the Canvas element
(function () {
	function mousePosition(event) {
		var totalOffsetX = 0,
			totalOffsetY = 0,
			coordX = 0,
			coordY = 0,
			currentElement = this,
			mouseX = 0,
			mouseY = 0;

		// Traversing the parents to get the total offset
		do {
			totalOffsetX += currentElement.offsetLeft;
			totalOffsetY += currentElement.offsetTop;
		}
		while ((currentElement = currentElement.offsetParent));
		// Use pageX to get the mouse coordinates
		if (event.pageX || event.pageY) {
			mouseX = event.pageX;
			mouseY = event.pageY;
		}
		// IE8 and below doesn't support event.pageX
		else if (event.clientX || event.clientY) {
			mouseX = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			mouseY = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		// Subtract the offset from the mouse coordinates
		coordX = mouseX - totalOffsetX;
		coordY = mouseY - totalOffsetY;

		return {
			x: coordX,
			y: coordY
		};
	}
	HTMLCanvasElement.prototype.mousePosition = mousePosition;
}());
