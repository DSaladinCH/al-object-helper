// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { read } from 'fs-extra';
import * as vscode from 'vscode';
import { FunctionType } from './Function/FunctionType';
import { ALDefinitionProvider, ALEventPublisherItem, ALHoverProvider, ALObjectHelperDocumentProvider, ALObjectItem, HelperFunctions, ObjectType } from './internal';
import { Reader } from "./Reader";
const clipboard = require('clipboardy');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export var reader: Reader;
export var extensionPrefix: string = "AL Object Helper: ";
export var shortcutRegex = RegExp("^((?:t|p|e|r)(?:e|ed)?|(?:c|x|q))([0-9]+)$", "mi");
export var variablePattern = /\s(\"[^\"\r\n\t]+\"|[a-z0-9\_]+)\s?\:\s([a-z\[\]0-9]+)\s?(\'[^\'\;]+\'|\"[^\"\;]+\"|of [^\"\;]+|[^\"\s\;]+|)( temporary)?\;/i;

export async function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "al-object-helper" is now active!');
	vscode.window.showInformationMessage("Congratulations, your extension \"al-object-helper\" is now active!");

	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('alObjectHelper', new ALObjectHelperDocumentProvider()));

	reader = new Reader(context);
	await reader.startReading();

	vscode.languages.registerDefinitionProvider('al', new ALDefinitionProvider(reader));
	vscode.languages.registerHoverProvider('al', new ALHoverProvider(reader));

	context.subscriptions.push(vscode.commands.registerCommand('al-object-helper.openALFile', async function () {
		var alObjects: ALObjectItem[] = [];
		reader.alApps.forEach(alApp => {
			alApp.alObjects.forEach(alObject => {
				alObjects.push(new ALObjectItem(alObject));
			});
		});

		const quickPick: vscode.QuickPick<vscode.QuickPickItem> = vscode.window.createQuickPick();
		quickPick.items = alObjects;
		quickPick.placeholder = "Search for a Object or use shortcut";
		quickPick.matchOnDescription = true;
		quickPick.matchOnDetail = true;
		quickPick.onDidChangeValue(function (e) {
			// check if input (e) is a object type shortcut
			// if yes insert it a quickitem
			// else remove the quickitem
			if (shortcutRegex.test(e)) {
				if (alObjects.length > 0 && alObjects[0].isTemporary) {
					// Modify first item
					alObjects[0].label = e.toLowerCase();
				}
				else {
					// Add first item
					alObjects = [ALObjectItem.createShortcutItem(e)].concat(alObjects);
				}
			}
			else {
				if (alObjects[0].isTemporary) {
					// Remove item
					alObjects.shift();
				}
			}
			quickPick.items = alObjects;
		});
		quickPick.onDidAccept(async function (event) {
			const alObjectItem = quickPick.selectedItems[0] as ALObjectItem;
			if (alObjectItem.isTemporary) {
				// open file with shortcut
				if (!await HelperFunctions.openFileWithShortcut(alObjectItem.label)) {
					vscode.window.showWarningMessage(extensionPrefix + `Could not open the shortcut ${alObjectItem.label}`);
				}
			}
			else {
				// open file from path
				if (!await HelperFunctions.openFile(alObjectItem.alObject)) {
					vscode.window.showWarningMessage(extensionPrefix + `Could not open the object with id ${alObjectItem.alObject.objectID}`);
				}
			}
		});

		quickPick.show();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('al-object-helper.copyEvent', async function () {
		var alObjects: ALObjectItem[] = [];
		reader.alApps.forEach(alApp => {
			alApp.alObjects.forEach(alObject => {
				if (alObject.functions.find(alFunction =>
					alFunction.functionType === FunctionType.InternalEvent ||
					alFunction.functionType === FunctionType.BusinessEvent ||
					alFunction.functionType === FunctionType.IntegrationEvent
				)) {
					alObjects.push(new ALObjectItem(alObject));
				}
			});
		});

		const quickPick: vscode.QuickPick<vscode.QuickPickItem> = vscode.window.createQuickPick();
		quickPick.items = alObjects;
		quickPick.placeholder = "Search for a Object or use shortcut";
		quickPick.matchOnDescription = true;
		quickPick.matchOnDetail = true;

		quickPick.onDidAccept(async function (event) {
			const alObjectItem = quickPick.selectedItems[0] as ALObjectItem;
			const events: ALEventPublisherItem[] = [];

			const functions = alObjectItem.alObject.functions.filter(alFunction =>
				alFunction.functionType === FunctionType.InternalEvent ||
				alFunction.functionType === FunctionType.BusinessEvent ||
				alFunction.functionType === FunctionType.IntegrationEvent
			);
			
			functions.forEach(alFunction => events.push(new ALEventPublisherItem(alFunction)));

			vscode.window.showQuickPick(events, { placeHolder: `Select event from ${ObjectType[alObjectItem.alObject.objectType]} "${alObjectItem.alObject.objectName}" to copy` }).then((value) => {
				if (value === undefined){
					return;
				}
				clipboard.writeSync(value.alFunction.getEventSubscriberText(alObjectItem.alObject));
				vscode.window.showInformationMessage("Copied to Clipboard!");
			});
		});

		quickPick.show();
	}));
}

// this method is called when your extension is deactivated
export function deactivate() { }
