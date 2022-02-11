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

var sidebarButton = document.getElementById("sidebar__button");
var sidebar = document.getElementById("sidebar");
var skriptEl = document.getElementById("skript");

var sidebarIsOpen = false;
var _focusedContentIndex = null;

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
