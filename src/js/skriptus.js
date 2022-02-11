const ipcRenderer = require("electron").ipcRenderer;


function genGUID() {
	let _GUID = "";
	let hex = "0123456789abcdef";

	for (var i = 0; i < 32; i++) {
		_GUID += hex[Math.floor(Math.random() * hex.length)];
	}

	return _GUID;
}


ipcRenderer.on("open", function() {
	let file = window.openFileDialog();

	if (file != undefined) {
		let data = window.getSkriptFile(file[0]);

		console.log(file[0], data);

		if (data != undefined) {
			skriptPath = file[0];
			loadSkript(data);
		}

	}
});

ipcRenderer.on("save", function() {
	// Check if file already exists

	console.log(skriptPath, window.fileExists(skriptPath));

	if (skriptPath == null || !window.fileExists(skriptPath))
		skriptPath = window.saveFileDialog();

	if (skriptPath != undefined) {
		window.writeSkriptFile(skriptPath, skript);
	}
});

ipcRenderer.on("new", function() {
	skript = {
		name: "New Skript",
		GUID: genGUID(),
		content: [
			{ type: "scene",
			  text: "" }
		]
	}

	renderSkript();
});


var skript = {
	name: "Example Skript",
	GUID: genGUID(),
	content: [
		{ type: "scene",
		  text: "INT. At the dinner table" },
		{ type: "character",
		  text: "Mark" },
		{ type: "dialogue",
		  text: "Hey." },
		{ type: "parentheses",
		  text: "He slowly looks up" },
		{ type: "dialogue",
		  text: "It has been a rough time. But now I can finally use this piece of software that helps me so god damn much" },
		{ type: "character",
		  text: "Anne" },
		{ type: "dialogue",
		  text: "Haha, what a story Mark" }
	]
}


function getNextType(type) {
	switch (type) {
		case "scene":
			return "character";
		case "character":
			return "dialogue";
		case "dialogue":
			return "dialogue";
		case "parentheses":
			return "dialogue";
	}
}

function renderSkript() {
	skriptEl.innerHTML = "";

	document.getElementsByTagName("title")[0].innerHTML = skript.name;

	skript.content.forEach((el, i) => {
		let line = document.createElement("p");
		line.classList.add("skript__line");
		line.classList.add("skript__" + el.type);

		line.innerHTML = el.text;

		line.setAttribute("contenteditable", true);

		(function(elIndex) {
			line.addEventListener("input", function(event) {
				if (event.inputType == "insertParagraph") {
					let newContent = [];

					skript.content.forEach((pi, pix) => {
						newContent.push(pi);

						if (elIndex == pix) {
							newContent.push({
								type: getNextType(pi.type),
								text: ""
							});
						}
					});

					_focusedContentIndex = elIndex + 1;

					skript.content = newContent;

					skript.content[elIndex].text = event.target.innerHTML;
					renderSkript();

				} else if (skript.content[elIndex].type == "dialogue" && event.target.innerHTML == "(") {
					skript.content[elIndex].type = "parentheses";
					skript.content[elIndex].text = "";
					renderSkript();

				} else {
					skript.content[elIndex].text = event.target.innerHTML;
				}
			});

			line.addEventListener("keydown", function(event) {
				if (event.key == "Backspace" && skript.content[elIndex].text == "") {
					// Remove this element
					delete skript.content[elIndex];

					// Remove undefined content
					skript.content = skript.content.filter((value, index, array) => {
						return value != undefined;
					});

					renderSkript();
				}
			});
		})(i)


		skriptEl.appendChild(line);

		if (i == _focusedContentIndex) {
			line.focus();
		}
	});
}

function loadSkript(data) {
	skript = data;
	renderSkript();
}

function getTypeFromClass(type) {
	let t = type.split("__")[1];
	return t.charAt(0).toUpperCase() + t.substr(1);
}

function getChildIndex(el) {
	return [...el.parentElement.children].indexOf(el);
}

function changeTypeFromEvent(event, newType) {
	skript.content[getChildIndex(event.target)].type = newType;
	renderSkript();
}

function contextMenuClose() {
	contextMenuIsOpen = false;
	contextMenu.style.display = "none";
}

function contextMenuOpen(posX, posY, options) {
	// options = [{label: ..., callback: ...}]

	contextMenu.style.display = "initial";
	contextMenu.style.left = posX + "px";
	contextMenu.style.top = posY + "px";
	contextMenuIsOpen = true;

	contextMenu.innerHTML = "";

	options.forEach((item, i) => {
		let cmItem = document.createElement("p");

		if (item.type == "category") {
			let categoryWrapperElement = document.createElement("div");
			cmItem.innerHTML = item.label;
			cmItem.classList.add("context-menu__category");
			categoryWrapperElement.classList.add("context-menu__category-wrapper");
			item.children.forEach((childItem, childItemIndex) => {
				let childItemElement = document.createElement("p");

				if (childItem.color != undefined)
					childItemElement.style.color = childItem.color;

				childItemElement.classList.add("context-menu__child-item");
				childItemElement.innerHTML = childItem.label;
				childItemElement.addEventListener("click", () => {
					contextMenuClose();
					childItem.callback();
				});

				categoryWrapperElement.appendChild(childItemElement);
			});

			contextMenu.appendChild(cmItem);
			contextMenu.appendChild(categoryWrapperElement);

		} else if (item.type == undefined || item.type == "button") {
			cmItem.classList.add("context-menu__item");

			if (item.color != undefined)
				cmItem.style.color = item.color;

			cmItem.addEventListener("click", () => {
				contextMenuClose();
				item.callback();
			});

			cmItem.innerHTML = item.label;
			contextMenu.appendChild(cmItem);

		} else if (item.type == "info") {
			cmItem.classList.add("context-menu__info-item");
			cmItem.innerHTML = item.label;
			contextMenu.appendChild(cmItem);

		} else if (item.type == "seperator") {
			cmItem.classList.add("context-menu__seperator");
			contextMenu.appendChild(cmItem);
		}

	});
}


var sidebarButton = document.getElementById("sidebar__button");
var sidebar = document.getElementById("sidebar");
var skriptEl = document.getElementById("skript");

var sidebarIsOpen = false;
var _focusedContentIndex = null;

var contextMenu = document.getElementById("context-menu");
var contextMenuIsOpen = false;

document.body.addEventListener("click", function(event) {
	if (event.target.id != "context-menu" && event.target.parentElement.id != "context-menu") {
		contextMenuClose();
	}
});

document.body.addEventListener("contextmenu", function(event) {
	if (event.target.classList.contains("skript__line")) {
		contextMenuOpen(event.clientX, event.clientY, [
			{ label: getTypeFromClass(event.target.classList[1]), type: "info"},
			{ type: "seperator"},
			{ label: "Change to", type: "category", children: [
				{ label: "Scene", color: "#6e7544", callback: () => {changeTypeFromEvent(event, "scene")}},
				{ label: "Character", color: "#6e7544", callback: () => {changeTypeFromEvent(event, "character")}},
				{ label: "Dialogue", color: "#6e7544", callback: () => {changeTypeFromEvent(event, "dialogue")}}
			]},
			{ type: "seperator"},
			{ label: "Duplicate", color: "#3d7882", callback: () => {console.log("DUPLICATE!")} },
			{ label: "Delete", color: "#8c3232", callback: () => {console.log("DELETE!")} }
		]);
	} else {
		contextMenuClose();
	}
});

sidebarButton.addEventListener("click", function() {
	sidebarIsOpen = !sidebarIsOpen;

	if (sidebarIsOpen) {
		sidebar.style.left = "0";
		sidebarButton.style.marginLeft = "200px";
		sidebarButton.innerHTML = "<";
	} else {
		sidebar.style.left = "-200px";
		sidebarButton.style.marginLeft = "0px";
		sidebarButton.innerHTML = ">";
	}
});

window.listFiles("skripts", (files) => {
	files.forEach((file, index) => {
		let skriptProject = document.createElement("p");
		skriptProject.classList.add("sidebar__skript");

		skriptData = getSkriptFile("skripts/" + file);
		skriptProject.innerHTML = skriptData.name;

		skriptProject.addEventListener("click", function() {
			// Check if current skript is saved
			if (skript.GUID != skriptData.GUID) {
				loadSkript(skriptData);
			}
		});

		sidebar.appendChild(skriptProject);
	});
});

skriptPath = null
renderSkript();
