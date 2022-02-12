const ipcRenderer = require("electron").ipcRenderer;
const { genGUID, insertAt, getTypeFromClass, getChildIndex } = require("./js/utils.js");
const { contextMenuOpen, contextMenuClose } = require("./js/contextMenu.js");



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


function renderSkript() {
	skriptEl.innerHTML = "";

	document.getElementsByTagName("title")[0].innerHTML = "Skriptus (" + skript.name + ")";

	skript.content.forEach((el, i) => {
		let line = document.createElement("p");
		line.classList.add("skript__line");
		line.classList.add(getClassFromTypeName(el.type));

		line.innerHTML = el.text;

		line.setAttribute("contenteditable", true);

		(function(elIndex) {
			line.addEventListener("input", function(event) {
				if (event.inputType == "insertParagraph") {
					// You can safely replace "<div><br></div>" with "", because if the user enters
					// that exact string, it is "&lt;div&gt;&lt;br&gt;&lt;/div&gt"
					event.target.innerHTML = event.target.innerHTML.replace("<div><br></div>", "");

					if (elIndex == skript.content.length - 1) {
						// Create new
						skript.content.push({
							type: getNextType(skript.content[elIndex].type),
							text: ""
						});
					} else {
						// Insert
						skript.content = insertAt(skript.content, {
							type: getNextType(skript.content[elIndex].type),
							text: ""
						}, elIndex + 1);
					}

					_focusedContentIndex = elIndex + 1;

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
					skriptContentDeleteUndefined();

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

function getNextType(type) {
	let _name = "dialogue";
	elements.forEach((el, index) => {
		if (el.name == type) {
			_name = el.nextElement;
		}
	});

	return _name;
}

function getClassFromTypeName(name) {
	let _class = "";
	elements.forEach((el, index) => {
		if (el.name == name) {
			_class = el.class;
		}
	});

	return _class;
}

function loadSkript(data) {
	skript = data;
	renderSkript();
}


function skriptContentDeleteUndefined() {
	// Because the deleted element is not deleted, but instead set to "undefined",
	// delete all undefined elements

	skript.content = skript.content.filter((value, index, array) => {
		return value != undefined;
	});
}

function changeTypeFromEvent(event, newType) {
	skript.content[getChildIndex(event.target)].type = newType;
	renderSkript();
}

function deleteElementFromEvent(event) {
	delete skript.content[getChildIndex(event.target)];
	skriptContentDeleteUndefined();

	renderSkript();
}

function duplicateElementFromEvent(event) {
	let elIndex = getChildIndex(event.target);
	let el = skript.content[elIndex];
	skript.content = insertAt(skript.content, {
		type: el.type,
		text: el.text
	}, elIndex + 1);

	_focusedContentIndex = elIndex + 1;

	renderSkript();
}


var skript = window.getStartupSkript();
var elements = window.getElementsFromFile();

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
			{ label: "Change to", type: "category", children: elements.map((i) => { return {
				label: i.prettyName,
				color: "#6e7544",
				callback: () => {changeTypeFromEvent(event, i.name)}
			}})},
			{ type: "seperator"},
			{ label: "Duplicate", color: "#3d7882", callback: () => {duplicateElementFromEvent(event)} },
			{ label: "Delete", color: "#8c3232", callback: () => {deleteElementFromEvent(event)} }
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
		skriptEl.style.filter = "blur(3px) brightness(95%)";
	} else {
		sidebar.style.left = "-200px";
		sidebarButton.style.marginLeft = "0px";
		sidebarButton.innerHTML = ">";
		skriptEl.style.filter = "";
	}
});

window.listFiles("skripts", (files) => {
	sidebar.innerHTML = "";

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
