const { dialog } = require("@electron/remote");
const fs = require("fs");


window.getSkriptFile = function (path) {
	return JSON.parse(String(fs.readFileSync(path)));
}

window.fileExists = function (path) {
	return fs.existsSync(path);
}

window.writeSkriptFile = function (path, data) {
	fs.writeFileSync(path, JSON.stringify(data, null, "\t"));
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
