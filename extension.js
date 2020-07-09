// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const Reader = require('./src/Reader.js');
const ALObjectItem = require('./src/ALObjectItem.js');
const AppPackageItem = require('./src/AppPackageItem.js');
const fs = require('fs-extra');
const path = require('path');
const QuickPickItem = require('./src/QuickPickItem.js');


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "al-object-helper" is now active!');
	vscode.window.showInformationMessage("Welcome to the AL Object Helper. If you like this extension, please rate it in the Marketplace :)");

	const reader = new Reader(context);
	const reloaded = reader.extensionContext.globalState.get('reloaded');
	new Promise(async () => {
		if (reloaded != undefined && reloaded) {
			await fs.emptyDir(reader.baseAppFolderPath);
			reader.extensionContext.globalState.update('reloaded', false);
		}
		reader.generateAll(true);
	})

	context.subscriptions.push(vscode.commands.registerCommand('al-object-helper.regenerate', async function () {
		const showConfirm = reader.extensionContext.globalState.get('showRegenerateConfirm');
		if (showConfirm != undefined && !showConfirm)
			reader.generateAll(false);
		else {
			var quickPick = vscode.window.createQuickPick();
			quickPick.items = [new QuickPickItem("OK"), new QuickPickItem("Cancle"), new QuickPickItem("OK, don't show again")];
			quickPick.placeholder = "This would lead to a reload of VS Code, okay?";
			quickPick.onDidAccept(function (event) {
				quickPick.hide();
				if (quickPick.selectedItems[0] == quickPick.items[0])
					reader.generateAll(false);
				else if (quickPick.selectedItems[0] == quickPick.items[2]) {
					// Don't show again
					reader.extensionContext.globalState.update('showRegenerateConfirm', false);
					reader.generateAll(false);
				}
			});
			quickPick.show();
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('al-object-helper.openALFile', async function () {
		var alObjects = [];
		reader.alObjects.forEach(element => {
			var objectItem = new ALObjectItem(element);
			alObjects.push(objectItem);
		});

		var quickPick = vscode.window.createQuickPick();
		quickPick.items = alObjects;
		quickPick.placeholder = "Search for a Object or use shortcut"
		quickPick.matchOnDescription = true;
		quickPick.matchOnDetail = true;
		quickPick.onDidChangeValue(function (e) {
			if (!alObjects[0].userInputField && e != '') {
				if (e != '' && validInput(e)) {
					const userInput = new ALObjectItem(e);
					userInput.userInputField = true;
					alObjects = [userInput].concat(alObjects);
				}
			}
			else {
				if (e != '' || validInput(e)) {
					var userInput = new ALObjectItem(e);
					userInput.userInputField = true;
					alObjects[0] = userInput;
				}
				else if (alObjects[0].userInputField)
					alObjects.shift();
			}
			quickPick.items = alObjects;
		});
		quickPick.onDidAccept(function (event) {
			const alObjectItem = ALObjectItem.convertToALObjectItem(quickPick.selectedItems[0]);
			if (alObjectItem.label == quickPick.value && alObjectItem.userInputField)
				reader.openFile(quickPick.value, '');
			else {
				if (alObjectItem.extension)
					reader.openFile(alObjectItem.shortType + 'd' + alObjectItem.id, alObjectItem.appPackageName);
				else
					reader.openFile(alObjectItem.shortType + alObjectItem.id, alObjectItem.appPackageName);
			}
		});

		quickPick.show();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('al-object-helper.packageSearch', async function () {
		var temp = [];
		reader.appPackages.forEach(element => {
			temp.push(new AppPackageItem(element.packageName, element.displayPackageName));
		});
		const selectedItem = await vscode.window.showQuickPick(temp, { placeHolder: "Select App Package" });

		if (selectedItem == undefined)
			return;
		const appPackage = AppPackageItem.convertToAppPackageItem(selectedItem);

		var alObjects = [];
		reader.alObjects.filter(element => element.appPackageName == appPackage.packageName).forEach(element => {
			var objectItem = new ALObjectItem(element, false);
			alObjects.push(objectItem);
		});
		alObjects.sort(function (a, b) {
			var nameA = a.label.toUpperCase();
			var nameB = b.label.toUpperCase();
			if (nameA < nameB) {
				return -1;
			}
			if (nameA > nameB) {
				return 1;
			}

			return 0;
		});

		var quickPick = vscode.window.createQuickPick();
		quickPick.placeholder = "Select AL Object of App " + appPackage.label;
		quickPick.items = alObjects;
		quickPick.matchOnDescription = true;
		quickPick.matchOnDetail = true;
		quickPick.onDidAccept(function (event) {
			const alObjectItem = ALObjectItem.convertToALObjectItem(quickPick.selectedItems[0]);
			if (alObjectItem.extension)
				reader.openFile(alObjectItem.shortType + 'd' + alObjectItem.id, alObjectItem.appPackageName);
			else
				reader.openFile(alObjectItem.shortType + alObjectItem.id, alObjectItem.appPackageName);
		});

		quickPick.show();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('al-object-helper.searchLocalFiles', async () => {
		await reader.detectCustomAlFiles(true, false);
	}));
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}

function validInput(input) {
	if (input.length <= 1)
		return false;

	input = input.toLowerCase();
	if (startsWithAny(input, ['ted', 'ped', 'eed']) && input.length >= 4) {
		if (hasLetter(input.substring(3)))
			return false;
		return true;
	}

	if (startsWithAny(input, ['te', 'pe', 'ee', 'rl']) && input.length >= 3) {
		if (hasLetter(input.substring(2)))
			return false;
		return true;
	}

	if (startsWithAny(input, ['t', 'p', 'c', 'r', 'x', 'e']) && input.length >= 2) {
		if (hasLetter(input.substring(1)))
			return false;
		return true;
	}

	return false;
}

function startsWithAny(str, arr) {
	var result = false;
	arr.forEach(element => {
		if (str.startsWith(element))
			result = true;
	});
	return result;
}

function hasLetter(myString) {
	return /[a-zA-Z]/.test(myString);
}