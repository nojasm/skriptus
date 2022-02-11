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
		if (i == index)
			newHaystack.push(needle);

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
