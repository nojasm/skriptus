const { dialog } = require("@electron/remote");
const fs = require("fs");
const path = require("path");
const os = require("os");

window.skriptusRoot = path.join(__dirname, "..", "..");

window.getSkriptFile = function (skriptPath) {
	if (!path.isAbsolute(skriptPath))
		skriptPath = path.join(skriptusRoot, skriptPath);

	try {
		return JSON.parse(fs.readFileSync(skriptPath));
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

window.getStartupSkript = function () {
	return window.getSkriptFile("config/startup.skript");
}

window.getGlobalOptions = function () {
	try {
		return JSON.parse(String(fs.readFileSync(path.join(window.skriptusRoot, "config/settings.json"))));
	} catch (e) {
		return false;
	}
}

window.setGlobalOptions = function (options) {
	return fs.writeFileSync(path.join(window.skriptusRoot, "config/settings.json"), JSON.stringify(options, null, "\t"));
}

window.openFileDialog = function () {
	return dialog.showOpenDialogSync({
		defaultPath: path.join(window.skriptusRoot, "skripts"),
		properties: ["openFile", "createDirectory"],
		filters: [{ name: "Skriptus skript file", extensions: ["skript"] }]
	});
}

window.saveFileDialog = function () {
	return dialog.showSaveDialogSync({
		defaultPath: path.join(window.skriptusRoot, "skripts"),
		properties: ["createDirectory"],
		filters: [{ name: "Skriptus skript file", extensions: ["skript"] }]
	});
}

window.listFiles = function (rootPath, callback) {
	if (!path.isAbsolute(rootPath))
		rootPath = path.join(window.skriptusRoot, rootPath);

	// Files:       "file-1", "file-2", ...
	// Directories: {"dir": ["file-a", "file-b", ...]}
	let tree = [];
	fs.readdir(rootPath, (err, files) => {
		if (err) {
			callback([]);
		} else {
			files = files.filter((f) => {
				f = path.join(rootPath, f);
				return fs.lstatSync(f).isFile();
			});
			callback(files);
		}
	})
}
