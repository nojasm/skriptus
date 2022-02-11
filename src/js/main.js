const { app, BrowserWindow, Menu, MenuItem } = require("electron");
const url = require("url");
const path = require("path");

function createWindow() {
	const win = new BrowserWindow({
		show: false,
		width: 800,
		height: 600,
		webPreferences: {
			contextIsolation: false,
			enableRemoteModule: true,
			nodeIntegration: true,
			preload: path.join(__dirname, "../js/preload.js")
		}
	});

	win.maximize();

	win.loadURL(url.format({
		pathname: path.join(__dirname, "../index.html"),
		protocol: "file:",
		slashes: true
	}));

	require("@electron/remote/main").initialize();
	require("@electron/remote/main").enable(win.webContents);
}


var isMac = process.platform === "darwin";

var template = [
	{
		label: "File",
		submenu: [
			{
				label: "New",
				accelerator: "CmdOrCtrl+N",
				click (item, focusedWindow) {
					if (focusedWindow) focusedWindow.webContents.send("new");
				}
			},
			{
				label: "Open",
				accelerator: "CmdOrCtrl+O",
				click (item, focusedWindow) {
					if (focusedWindow) focusedWindow.webContents.send("open");
				}
			},
			{
				label: "Save",
				accelerator: "CmdOrCtrl+S",
				click (item, focusedWindow) {
					if (focusedWindow) focusedWindow.webContents.send("save");
				}
			},
			{
				label: "Save as",
				accelerator: "CmdOrCtrl+Shift+S",
				click (item, focusedWindow) {
					if (focusedWindow) focusedWindow.webContents.send("saveas");
				}
			},
			{
				role: "quit"
			}
		]
	},
	{
		label: "Edit",
		submenu: []
	},
	{
		label: "View",
		submenu: [
			{
				role: "Reload",
				accelerator: "CmdOrCtrl+R",
				click (item, focusedWindow) {
					if (focusedWindow) focusedWindow.reload();
				}
			},
			{
				label: "Toggle Dev-Tools",
				accelerator: isMac ? "Alt+Command+I" : "Ctrl+Shift+I",
				click (item, focusedWindow) {
					if (focusedWindow) focusedWindow.toggleDevTools();
				}
			},
			{
				role: "zoomin"
			},
			{
				role: "zoomout"
			},
			{
				role: "resetzoom"
			}
		]
	}
]

menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
app.on("ready", createWindow);
