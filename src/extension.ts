// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import clipboard = require('clipboardy');
import { ALDefinitionProvider, ALExtension, ALHoverProvider, ALObject, ALObjectHelperDocumentProvider, AppType, FunctionType, HelperFunctions, ObjectType, Reader, UIManagement } from './internal';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export var reader: Reader;
export var extensionPrefix: string = "AL Object Helper: ";
export var shortcutRegex = RegExp("^((?:t|p|e|r)(?:e|ed)?|(?:c|x|q))([0-9]+)$", "mi");
export var variablePattern = /\s(\"[^\"\r\n\t]+\"|[a-z0-9\_]+)\s?\:\s([a-z\[\]0-9]+)\s?(\'[^\'\;]+\'|\"[^\"\;]+\"|of [^\"\;]+|[^\"\s\;]+|)( temporary)?\;/i;
export var textDocumentScheme = "alObjectHelper";

var isALExtension: boolean;
var currentExtendedObject: ALObject | undefined;
var hasALExtensions: boolean;
var currentExtensions: ALExtension[];

export async function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "al-object-helper" is now active!');
	//vscode.window.showInformationMessage("Congratulations, your extension \"al-object-helper\" is now active!");

	setIsALExtension(false);

	reader = new Reader(context);
	await reader.startReading();

	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(textDocumentScheme, new ALObjectHelperDocumentProvider()));
	vscode.languages.registerDefinitionProvider('al', new ALDefinitionProvider(reader));
	vscode.languages.registerHoverProvider('al', new ALHoverProvider(reader));

	context.subscriptions.push(vscode.commands.registerCommand('al-object-helper.openALObject', async function () {
		const alObject = await UIManagement.selectALObjectInApps(reader.alApps);
		if (!alObject) {
			return;
		}

		if (await HelperFunctions.openFile(alObject)) {
			vscode.window.showInformationMessage(`Opened ${ObjectType[alObject.objectType]} ${alObject.objectName}`);
		}
		else {
			vscode.window.showWarningMessage("Could not find or open this object");
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('al-object-helper.openALObjectOfApp', async function () {
		const alApp = await UIManagement.selectALApp(reader.alApps);
		if (!alApp) {
			return;
		}

		const alObject = await UIManagement.selectALObjectInApp(alApp);
		if (!alObject) {
			return;
		}

		if (await HelperFunctions.openFile(alObject)) {
			vscode.window.showInformationMessage(`Opened ${ObjectType[alObject.objectType]} ${alObject.objectName}`);
		}
		else {
			vscode.window.showWarningMessage("Could not find or open this object");
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('al-object-helper.copyEvent', async function () {
		var alObjects: ALObject[] = [];
		reader.alApps.forEach(alApp => {
			alApp.alObjects.forEach(alObject => {
				if (alObject.functions.find(alFunction =>
					alFunction.functionType === FunctionType.InternalEvent ||
					alFunction.functionType === FunctionType.BusinessEvent ||
					alFunction.functionType === FunctionType.IntegrationEvent
				)) {
					alObjects.push(alObject);
				}
			});
		});

		const alObject = await UIManagement.selectALObject(alObjects);
		if (!alObject) {
			return;
		}

		const alFunction = await UIManagement.selectEventPublisher(alObject);
		if (!alFunction) {
			return;
		}

		clipboard.writeSync(alFunction.getEventSubscriberText(alObject));
		vscode.window.showInformationMessage("Copied to Clipboard!");
	}));

	context.subscriptions.push(vscode.commands.registerCommand('al-object-helper.jumpToEventSubscriber', async function () {
		const alFunction = await UIManagement.selectEventSubscriber(reader.alApps.filter(alApp => alApp.appType === AppType.local));
		if (!alFunction) {
			return;
		}

		HelperFunctions.openFile(alFunction.alObject, alFunction.alFunction.lineNo);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('al-object-helper.openExtendedObject', async function () {
		if (!currentExtendedObject) {
			return;
		}

		await HelperFunctions.openFile(currentExtendedObject);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('al-object-helper.showObjectExtension', async function () {
		if (currentExtensions.length === 0) {
			return;
		}

		let alObject = await UIManagement.selectALObject(currentExtensions);
		if (!alObject) {
			return;
		}

		await HelperFunctions.openFile(alObject);
	}));

	vscode.window.onDidChangeActiveTextEditor((textEditor) => {
		setIsALExtension(false);
		sethasALExtension(false);

		if (!textEditor) {
			return;
		}

		const uri = textEditor.document.uri;
		if (!uri) {
			return;
		}

		let alObject: ALObject | undefined;
		if (uri.scheme === textDocumentScheme) {
			// al object of this extension
			alObject = HelperFunctions.getALObjectByUriFragment(uri.fragment);

		}
		else {
			// local al object
			for (let i = 0; i < reader.alApps.length; i++) {
				alObject = reader.alApps[i].alObjects.find(alObject => alObject.objectPath === uri.fsPath);
				if (alObject) {
					break;
				}
			}
		}

		if (!alObject) {
			return;
		}

		checkIsALExtension(alObject);
		checkHasALExtensions(alObject);
	});
}

// this method is called when your extension is deactivated
export function deactivate() { }

function checkIsALExtension(alObject: ALObject) {
	setIsALExtension(false);
	if (!alObject.isExtension()) {
		return;
	}

	currentExtendedObject = (alObject as ALExtension).parent;
	if (currentExtendedObject) {
		setIsALExtension(true);
	}
}

function checkHasALExtensions(alObject: ALObject) {
	sethasALExtension(false);

	currentExtensions = alObject.getAllExtensions(reader.alApps);
	if (currentExtensions.length > 0) {
		sethasALExtension(true);
	}
}

export function setIsALExtension(isExtension: boolean) {
	if (!isExtension) {
		currentExtendedObject = undefined;
	}
	isALExtension = isExtension;
	vscode.commands.executeCommand('setContext', 'al-object-helper.isALExtension', isALExtension);
}

export function sethasALExtension(hasExtension: boolean) {
	if (!hasExtension) {
		currentExtensions = [];
	}
	hasALExtensions = hasExtension;
	vscode.commands.executeCommand('setContext', 'al-object-helper.hasALExtensions', hasALExtensions);
}