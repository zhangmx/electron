import { Mutex } from 'async-mutex';
import { execFile } from 'child_process';
import * as debug_ from 'debug';
import * as electron from 'electron';
import { readFileSync } from 'fs';
import { join } from 'path';
import { stringify } from 'querystring';

const debug = debug_('balena-electronjs');

const SIDEBAR_WIDTH = 200;

function exec(
	...command: string[]
): Promise<{ stdout: string; stderr: string }> {
	return new Promise((resolve, reject) => {
		execFile(command[0], command.slice(1), (error, stdout, stderr) => {
			if (error) {
				reject(error);
			} else {
				resolve({ stdout, stderr });
			}
		});
	});
}

function createSidebar(height: number) {
	const win = new BrowserWindow({
		width: SIDEBAR_WIDTH,
		height,
		x: 0,
		y: 0,
		frame: false,
		webPreferences: {
			nodeIntegration: true,
		},
	});
	win.loadURL(`file://${__dirname}/sidebar.html`);
}

function createOpenDialogWindow(
	options: electron.OpenDialogOptions,
	callback: ShowOpenDialogCallback,
) {
	electron.ipcMain.once('select-files', (_event: Event, arg: any) => {
		callback(arg);
	});
	const win = new electron.BrowserWindow({
		frame: false,
		webPreferences: {
			nodeIntegration: true,
		},
	});
	win.loadURL(
		`file://${__dirname}/file-picker.html?${stringify(options as {
			[key: string]: any;
		})}`,
	);
}

let keyboardVisible = false;

async function setKeyboardVisibility(visible: boolean): Promise<void> {
	await exec(
		'dbus-send',
		'--type=method_call',
		'--dest=org.onboard.Onboard',
		'/org/onboard/Onboard/Keyboard',
		`org.onboard.Onboard.Keyboard.${visible ? 'Show' : 'Hide'}`,
	);
}

const keyboardMutex = new Mutex();

electron.ipcMain.on('input-focus', async () => {
	const release = await keyboardMutex.acquire();
	if (!keyboardVisible) {
		await setKeyboardVisibility(true);
		keyboardVisible = true;
	}
	release();
});

electron.ipcMain.on('input-blur', async () => {
	const release = await keyboardMutex.acquire();
	if (keyboardVisible) {
		await setKeyboardVisibility(false);
		keyboardVisible = false;
	}
	release();
});

const focusScript = readFileSync(join(__dirname, 'focus.js'), {
	encoding: 'utf8',
});

function ready() {
	const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
	createSidebar(height);
	// _init exists on BrowserWindow's prototype
	// @ts-ignore
	const originalInit = electron.BrowserWindow.prototype._init;
	// @ts-ignore
	electron.BrowserWindow.prototype._init = function() {
		originalInit.call(this);
		this.setBounds({
			x: SIDEBAR_WIDTH,
			y: 0,
			width: width - SIDEBAR_WIDTH,
			height,
		});
		this.webContents.on('dom-ready', () => {
			this.webContents.executeJavaScript(focusScript);
		});
	};
}

const originalBrowserWindow = electron.BrowserWindow;

class BrowserWindow extends originalBrowserWindow {
	constructor(options: any) {
		// TODO
		super(options);
	}
}

// @ts-ignore
BrowserWindow.prototype._init = electron.BrowserWindow.prototype._init;

// ----- TODO: move to separate dialog file ------------
const originalShowOpenDialog = electron.dialog.showOpenDialog;

type ShowOpenDialogCallback = (
	filePaths?: string[],
	bookmarks?: string[],
) => void;

function showOpenDialog(
	browserWindow: electron.BrowserWindow,
	options: electron.OpenDialogOptions,
	callback?: ShowOpenDialogCallback,
): string[] | undefined;

function showOpenDialog(
	options: electron.OpenDialogOptions,
	callback?: ShowOpenDialogCallback,
): string[] | undefined;

// TODO: don't allow opening more than one open dialog
function showOpenDialog(
	arg0: electron.BrowserWindow | electron.OpenDialogOptions,
	arg1?: electron.OpenDialogOptions | ShowOpenDialogCallback,
	arg2?: ShowOpenDialogCallback,
): string[] | undefined {
	let browserWindow: electron.BrowserWindow | undefined;
	let options: electron.OpenDialogOptions;
	let callback: ShowOpenDialogCallback | undefined;
	if (arg0 instanceof electron.BrowserWindow) {
		browserWindow = arg0;
		options = arg1 as electron.OpenDialogOptions;
		callback = arg2;
	} else {
		options = arg1 as electron.OpenDialogOptions;
		callback = arg2;
	}
	if (callback === undefined) {
		debug(
			'Calling showOpenDialog with no callback is not supported, falling back to native file picker',
		);
		if (browserWindow === undefined) {
			return originalShowOpenDialog(options);
		} else {
			return originalShowOpenDialog(browserWindow, options);
		}
	}
	createOpenDialogWindow(options, callback);
	return undefined;
}

electron.dialog.showOpenDialog = showOpenDialog;
// ------------------------------------------------

electron.app.on('ready', ready);