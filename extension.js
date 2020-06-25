// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const Reader = require('./src/Reader.js');


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "al-object-helper" is now active!');
	vscode.window.showInformationMessage("Welcome to the AL Object Helper :)");

	const reader = new Reader();
	await reader.generateAll(true);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('al-object-helper.regenerate', async function () {
		await reader.generateAll(false);
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('al-object-helper.openALFile', async function () {
		var input = await vscode.window.showInputBox({ placeHolder: "Object Shortcut + Object ID (ex. T18)" });
		reader.openFile(input);
	});

	context.subscriptions.push(disposable);
	console.log('Registered all commands');
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
