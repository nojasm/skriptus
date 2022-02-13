const ipcRenderer = require("electron").ipcRenderer;
const { genGUID, insertAt, getTypeFromClass, getChildIndex, rectsDoOverlap } = require("./js/utils.js");
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

	if (skript.content.length == 0)
		skript.content.push({
			type: "scene",
			text: ""
		});

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

function changeTypeFromIndex(index, newType) {
	skript.content[index].type = newType;
	renderSkript();
}

function changeTypeFromEvent(event, newType) {
	changeTypeFromIndex(getChildIndex(event.target), newType);
}

function deleteElementFromEvent(event) {
	let index = getChildIndex(event.target);

	delete skript.content[index];
	skriptContentDeleteUndefined();

	renderSkript();
}

function duplicateElementFromEvent(event) {
	let index = getChildIndex(event.target);
	let el = skript.content[index];

	skript.content = insertAt(skript.content, {
		type: el.type,
		text: el.text
	}, index + 1);

	_focusedContentIndex = index + 1;

	renderSkript();
}

function deleteSelected() {
	let newContent = [];
	skript.content.forEach((el, i) => {
		if (!selectedIndices.includes(i)) {
			newContent.push(el);
		}
	});

	skript.content = newContent;

	renderSkript();
}

function duplicateSelected() {
	// console.log("Insert", getSelectedElements(), "at index", selectedIndices[selectedIndices.length - 1]);
	if (skript.content.length == selectedIndices.length) {
		// Add
		getSelectedElements().forEach((el, _) => {
			skript.content.push(el);
		})
	} else {
		// Insert
		skript.content = insertAt(
			skript.content,
			getSelectedElements(),
			selectedIndices[selectedIndices.length - 1] + 1
		);
	}

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

var selectionEl = document.getElementById("selection");
var selectionCtx = selectionEl.getContext("2d");
var selectionStart = [null, null];
var isSelecting = false;
var selectedIndices = [];

var main = document.getElementById("main");

function resizeSelectionElementToMax() {
	selectionEl.style.width = document.body.clientWidth + "px";
	selectionEl.style.height = document.body.clientHeight + "px";
	selectionEl.width = document.body.clientWidth;
	selectionEl.height = document.body.clientHeight;
}

resizeSelectionElementToMax();

window.addEventListener("resize", function() {
	resizeSelectionElementToMax();
});

function startSelection(x, y) {
	isSelecting = true;
	selectionStart = [x, y];
}

function updateSelection() {
	// Remove "undefined" items
	selectedIndices = selectedIndices.filter((value, index, array) => {
		return value != undefined;
	});

	skript.content.forEach((el, i) => {
		let domEl = document.getElementsByClassName("skript__line")[i];
		if (selectedIndices.includes(i)) {
			domEl.classList.add("selection__selected");
		} else {
			domEl.classList.remove("selection__selected");
		}
	});
}

function isBetween(a, b, val) {
	a = Math.abs(a);
	b = Math.abs(b);

	if (a > b) {
		return a > val && val > b;
	} else if (b > a) {
		return b > val && val > a;
	}
}

function setSelectionBox(pos1, pos2) {
	// Put box on ctx here
	selectionCtx.fillStyle = "#77befd33";
	selectionCtx.clearRect(0, 0, selectionEl.width, selectionEl.height);
	selectionCtx.fillRect(pos1[0], pos1[1], pos2[0] - pos1[0], pos2[1] - pos1[1]);
	//selectionCtx.fillRect(0, 0, 50, 50);

	// Now mark everything between selectionStart and [x, y]
	skript.content.forEach((el, i) => {
		// Check if element is in selection
		let domEl = document.getElementsByClassName("skript__line")[i];
		let rect = domEl.getBoundingClientRect();
		let r = {};
		r.x = pos1[0]; r.y = pos1[1]; r.width = pos2[0] - pos1[0]; r.height = pos2[1] - pos1[1];

		if (r.height < 0) {
			r.y += r.height;
			r.height = Math.abs(r.height);
		}

		if (r.width < 0) {
			r.x += r.width;
			r.width = Math.abs(r.width);
		}

		if (rectsDoOverlap(r, rect)) {
			if (!selectedIndices.includes(i))
				selectedIndices.push(i);

		} else {
			if (selectedIndices.indexOf(i) >= 0)
				delete selectedIndices[selectedIndices.indexOf(i)];
		}
	});

	selectedIndices = selectedIndices.sort();

	updateSelection();
}

function endSelection(x, y) {
	isSelecting = false;
	selectionStart = [null, null];

	selectionCtx.clearRect(0, 0, selectionEl.width, selectionEl.height);

	// Select elements
}

function clearSelection() {
	selectionCtx.clearRect(0, 0, selectionEl.width, selectionEl.height);

	selectedIndices = [];
	isSelecting = false;

	skript.content.forEach((el, i) => {
		let domEl = document.getElementsByClassName("skript__line")[i];
		if (domEl.classList.contains("selection__selected"))
			domEl.classList.remove("selection__selected");
	});
}

function getSelectedElements() {
	// Use filter here
	let se = [];
	skript.content.forEach((item, i) => {
		if (selectedIndices.includes(i))
			se.push(item);
	})

	return se;
}

function getPrettyNameFromType(name) {
	let _name = "?";
	elements.forEach((el, i) => {
		if (el.name == name) _name = el.prettyName;
	});

	return _name;
}

function getCMInfoTextFromSelections() {
	// If all of the selected elements are of the same type, this
	// function will return this type. If not, it will return a "*" instead.

	let _type = null;
	getSelectedElements().forEach((el, i) => {
		// Use getPrettyNameFromType(el.type) here
		if (_type == null) _type = el.type;
		else if (_type != el.type) _type = "*";
	});

	if (_type != "*")
		_type = getPrettyNameFromType(_type);

	return _type + " (" + selectedIndices.length + ")"
}

document.body.addEventListener("mousedown", function(event) {
	if ((event.target.id != "context-menu" && event.target.parentElement.id != "context-menu" && event.target.parentElement.parentElement.id != "context-menu") &&
		event.button == 0 && selectedIndices.length > 0) {
		clearSelection();

	} else {
		if (event.target.id == "main" || event.target.id == "skript") {
			contextMenuClose();
			startSelection(event.pageX, event.pageY);
		}
	}

});

document.body.addEventListener("mouseup", function(event) {
	if (isSelecting) {
		endSelection(event.pageX, event.pageY);
	}
});

document.body.addEventListener("mousemove", function(event) {
	if (isSelecting) {
		setSelectionBox(selectionStart, [event.pageX, event.pageY])
	}
});



document.body.addEventListener("click", function(event) {
	if (event.target.id != "context-menu" && event.target.parentElement.id != "context-menu") {
		contextMenuClose();
	}
});

document.body.addEventListener("contextmenu", function(event) {
	if (event.target.classList.contains("skript__line")) {
		if (selectedIndices.length <= 1) {
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
			contextMenuOpen(event.clientX, event.clientY, [
				{ label: getCMInfoTextFromSelections(), type: "info"},
				{ type: "seperator"},
				{ label: "Change to", type: "category", children: elements.map((i) => { return {
					label: i.prettyName,
					color: "#6e7544",
					callback: () => {selectedIndices.forEach((ix, _) => {changeTypeFromIndex(ix, i.name)}); clearSelection()}
				}})},
				{ type: "seperator"},
				{label: "Duplicate", color: "#3d7882", callback: () => {duplicateSelected(); clearSelection()} },
				{ label: "Delete", color: "#8c3232", callback: () => {deleteSelected(); clearSelection()} }
			]);
		}
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
