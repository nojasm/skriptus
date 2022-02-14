const { dialog } = require("@electron/remote");
const fs = require("fs");


window.getSkriptFile = function (path) {
	try {
		return JSON.parse(fs.readFileSync(path));
	} catch (e) {
		return false;
	}
}

window.fileExists = function (path) {
	return fs.existsSync(path);
}

window.writeSkriptFile = function (path, data) {
	fs.writeFileSync(path, JSON.stringify(data, null, "\t"));
}

window.getElementsFromFile = function () {
	return JSON.parse(String(fs.readFileSync("./config/elements.json")));
}

window.getStartupSkript = function () {
	return window.getSkriptFile("./config/startup.skript");
}

window.getGlobalOptions = function () {
	try {
		console.log(String(fs.readFileSync("./config/settings.json")));
		return JSON.parse(String(fs.readFileSync("./config/settings.json")));
	} catch (e) {
		return false;
	}
}

window.setGlobalOptions = function (options) {
	return fs.writeFileSync("./config/settings.json", JSON.stringify(options, null, "\t"));
}

window.openFileDialog = function () {
	return dialog.showOpenDialogSync({
		defaultPath: "./skripts",
		properties: ["openFile", "createDirectory"],
		filters: [{ name: "Skriptus skript file", extensions: ["skript"] }]
	});
}

window.saveFileDialog = function () {
	return dialog.showSaveDialogSync({
		defaultPath: "./skripts",
		properties: ["createDirectory"],
		filters: [{ name: "Skriptus skript file", extensions: ["skript"] }]
	});
}

window.listFiles = function (path, callback) {
	fs.readdir(path, (err, files) => {
		if (err)
			callback([]);
		else
			callback(files);
	})
}
