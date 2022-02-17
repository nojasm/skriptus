/*
	This module acts as an API to the small-window div object in the index.html.
	It is initialized as <smallWindow> at the top of the skriptus.js. To use it,
	you should call smallWindow.empty() first to clear the body of the window.

	You can use its <onopen> and <onclose> callback functions to define what
	happends if the window gets opened or closed.
*/

exports.SmallWindow = class {
	constructor() {
		this._win = document.getElementById("small-window");
		this._title = document.getElementById("small-window__title");
		this._closeButton = document.getElementById("small-window__close");
		this.body = document.getElementById("small-window__body");

		this.onopen = () => {};
		this.onclose = () => {};

		this._closeButton.addEventListener("click", function() {
			smallWindow.onclose();
			smallWindow._win.style.display = "none";
		});
	}

	show() {
		this.onopen();
		this._win.style.display = "initial";
	}

	setTitle(text) {
		this._title.innerHTML = text;
	}

	empty() {
		this.body.innerHTML = "";
	}
}
