const ipcRenderer = require("electron").ipcRenderer;
const { genGUID, insertAt, getTypeFromClass, getChildIndex, rectsDoOverlap, getElements, setSkriptName } = require("./js/utils.js");
const { contextMenuOpen, contextMenuClose } = require("./js/contextMenu.js");
const { skriptSettingsOpen, globalSettingsOpen, reloadSettingsFromOptions } = require("./js/settings.js");
const { importSkriptFountain, exportSkript } = require("./js/importExport.js");



ipcRenderer.on("open", function() {
	let file = window.openFileDialog();

	if (file != undefined) {
		let data = window.getSkriptFile(file[0]);

		if (data != undefined) {
			skriptPath = file[0];
			loadSkript(data);
		}
	}
});

ipcRenderer.on("save", function() {
	// Check if file already exists

	if (skriptPath == null || !window.fileExists(skriptPath))
		skriptPath = window.saveFileDialog();

	if (skriptPath != undefined) {
		window.writeSkriptFile(skriptPath, skript);

		savedSkript = copyObject(skript);
		reloadSidebar();
		checkIfSaved();

	} else {
		skriptPath = null;
	}
});

ipcRenderer.on("save-as", function() {
	skriptPath = window.saveFileDialog();

	if (skriptPath != undefined) {
		window.writeSkriptFile(skriptPath, skript);

		savedSkript = copyObject(skript);
		reloadSidebar();
		checkIfSaved();

	} else {
		skriptPath = null;
	}
});

ipcRenderer.on("new", function() {
	skript = {
		name: "New Skript",
		GUID: genGUID(),
		content: [
			{ type: "scene",
			  text: "" }
		],
		"css": []
	}

	savedSkript = null;
	skriptPath = null;

	renderSkript();
	skriptSettingsOpen(newSkript=true);
});


ipcRenderer.on("skript-settings", function() {
	skriptSettingsOpen();
});

ipcRenderer.on("global-settings", function() {
	globalSettingsOpen();
});


ipcRenderer.on("import-fountain", function() {
	let data = importSkriptFountain();

	if (data != undefined) {
		skriptPath = null;
		loadSkript(data);
	} else {
		// WARNING: Set info here: Fountain skript wasn't loaded correcly or is invalid
	}
});

ipcRenderer.on("export", function() {
	exportSkript();
});


reloadSettingsFromOptions(window.getGlobalOptions().css);


function renderSkript() {
	skriptEl.innerHTML = "";

	if (skript.content.length == 0)
		skript.content.push({
			type: "scene",
			text: ""
		});

	selectedIndices = [];

	checkIfSaved();

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
					deleteElementFromEvent(event);
				}
			});


			line.addEventListener("focus", function(event) {
				if (isSelecting) {
					// Don't focus event if only selecting
					event.target.blur();
				} else {
					event.target.classList.add("text-selectable");
				}

			});

			line.addEventListener("focusout", function(event) {
				event.target.classList.remove("text-selectable");
			});
		})(i)

		skriptEl.appendChild(line);

		// For focusing after element insert
		if (i == _focusedContentIndex) {
			line.focus();
		}
	});

	// FFor focusing after element remove
	[...skriptEl.children].forEach((line, i) => {
		if (_nextToFocusIndex != null && i == _nextToFocusIndex) {
			line.focus();
			let _val = line.value;
			line.value = "";
			line.value = _val;
			_nextToFocusIndex = null;
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

function copyObject(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function loadSkript(data) {
	skript = data;
	savedSkript = copyObject(skript);
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

	if (index == 0) {
		_nextToFocusIndex = 0;
	} else {
		_nextToFocusIndex = index - 1;
	}

	renderSkript();
}

function duplicateElementFromEvent(event) {
	let index = getChildIndex(event.target);
	let el = skript.content[index];


	if (index == skript.content.length - 1) {
		skript.content.push({
			type: el.type,
			text: el.text
		});
	} else {
		skript.content = insertAt(skript.content, {
			type: el.type,
			text: el.text
		}, index + 1);
	}


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
	// If the last element was selected, append (push) to elements instead of insert
	if (skript.content.length == selectedIndices[selectedIndices.length - 1] + 1) {
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
var savedSkript = copyObject(skript);  // To test if file is unsaved. Set this to be the skript, to check for any changes

var elements = getElements();

if (skript.GUID == null) {
	skript.GUID = genGUID();
	savedSkript.GUID = skript.GUID;
}

var sidebarButton = document.getElementById("sidebar__button");
var sidebar = document.getElementById("sidebar");
var skriptEl = document.getElementById("skript");

var sidebarIsOpen = false;
var _focusedContentIndex = null;
var _nextToFocusIndex = null;


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
	selectionCtx.fillRect(pos1[0] - window.scrollX, pos1[1] - window.scrollY, pos2[0] - pos1[0], pos2[1] - pos1[1]);
	//selectionCtx.fillRect(0, 0, 50, 50);

	// Now mark everything between selectionStart and [x, y]
	skript.content.forEach((el, i) => {
		// Check if element is in selection
		let domEl = document.getElementsByClassName("skript__line")[i];
		let rect = domEl.getBoundingClientRect();
		let r = {};
		r.x = pos1[0]; r.y = pos1[1] - window.scrollY; r.width = pos2[0] - pos1[0]; r.height = pos2[1] - pos1[1];

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

function checkIfSaved() {
	let isSaved = false;

	// Check if the current skript and a copy of that skript are identical.
	// WARNING: May be slow on bigger skripts. Maybe check for their length first?
	isSaved = JSON.stringify(skript) == JSON.stringify(savedSkript);

	if (isSaved) {
		document.getElementsByTagName("title")[0].innerHTML = "Skriptus (" + skript.name + ")";
	} else {
		document.getElementsByTagName("title")[0].innerHTML = "* Skriptus (" + skript.name + ") *";
	}
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
	// function will return this type. If not, it will return a "*"
	// with the number of selected elements instead.

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

function reloadSidebar() {
	window.listFiles("skripts", (files) => {
		sidebar.innerHTML = "";

		files.forEach((file, index) => {
			let skriptProject = document.createElement("p");
			skriptProject.classList.add("sidebar__skript");

			skriptData = getSkriptFile("skripts/" + file);
			skriptProject.innerHTML = skriptData.name;

			skriptProject.title = "skripts/" + file;

			skriptProject.addEventListener("click", function() {
				// Check if current skript is saved
				if (skript.GUID != skriptData.GUID) {
					loadSkript(skriptData);
				}
			});

			sidebar.appendChild(skriptProject);
		});
	});
}

document.body.addEventListener("input", function() {
	checkIfSaved();
});

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
	if (isSelecting && event.buttons === 1) {
		setSelectionBox(selectionStart, [event.pageX, event.pageY])
	} else if (event.buttons === 0) {
		endSelection(event.pageX, event.pageY);
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

window.addEventListener("keydown", function(event) {
	if (selectedIndices.length > 0) {
		if (event.key == "Delete") {
			deleteSelected();
		} else if (event.ctrlKey && event.key == "d") {
			duplicateSelected();
		}
	}
});


sidebarButton.addEventListener("click", function() {
	sidebarIsOpen = !sidebarIsOpen;

	if (sidebarIsOpen) {
		sidebar.style.left = "0";
		sidebarButton.style.marginLeft = "200px";
		sidebarButton.innerHTML = "<";
		skriptEl.style.filter = "blur(var(--sidebar-background-blur)) brightness(var(--sidebar-background-brightness))";
	} else {
		sidebar.style.left = "-200px";
		sidebarButton.style.marginLeft = "0px";
		sidebarButton.innerHTML = ">";
		skriptEl.style.filter = "";
	}
});



skriptPath = null;
reloadSidebar();
renderSkript();
