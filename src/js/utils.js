exports.genGUID = function () {
	let _GUID = "";
	let hex = "0123456789abcdef";

	for (var i = 0; i < 32; i++) {
		_GUID += hex[Math.floor(Math.random() * hex.length)];
	}

	return _GUID;
}

exports.insertAt = function (haystack, needle, index) {
	let newHaystack = [];
	haystack.forEach((item, i) => {
		if (i == index) {
			if (needle instanceof Object) {
				needle.forEach((ni, _) => {newHaystack.push(ni)})
			} else {
				newHaystack.push(needle);
			}
		}

		newHaystack.push(item);
	});

	return newHaystack;
}

exports.getTypeFromClass = function (type) {
	let t = type.split("__")[1];
	return t.charAt(0).toUpperCase() + t.substr(1);
}

exports.getChildIndex = function (el) {
	return [...el.parentElement.children].indexOf(el);
}

function valueInRange(val, min, max) {
	return (val >= min) && (val <= max);
}

exports.rectsDoOverlap = function (rect1, rect2) {
	let xOverlap = valueInRange(rect1.x, rect2.x, rect2.x + rect2.width) ||
	               valueInRange(rect2.x, rect1.x, rect1.x + rect1.width);

	let yOverlap = valueInRange(rect1.y, rect2.y, rect2.y + rect2.height) ||
	               valueInRange(rect2.y, rect1.y, rect1.y + rect1.height);

	return (xOverlap && yOverlap);
}
