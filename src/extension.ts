// The module "vscode" contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { ALApp, ALDefinitionProvider, ALExtension, ALFunction, ALFunctionItem, ALHoverProvider, ALObject, ALObjectHelperDocumentProvider, ALObjectHelperTreeDataProvider, AppType, FunctionType, HelperFunctions, ObjectType, QuickPickManagement, Reader, UIManagement } from './internal';
import os = require('os');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export var reader: Reader;
export var extensionPrefix: string = "AL Object Helper: ";
export var shortcutRegex = RegExp("^((?:t|p|e|r|ps)(?:e|ed)?|(?:c|x|q))([0-9]+)$", "mi");
export var variablePattern = /\s(\"[^\"\r\n\t]+\"|[a-z0-9\_]+)\s?\:\s([a-z\[\]0-9]+)\s?(\'[^\'\;]+\'|\"[^\"\;]+\"|of [^\"\;]+|[^\"\s\;]+|)( temporary)?\;/i;
export var textDocumentScheme = "alObjectHelper";

var isALExtension: boolean;
var currentExtendedObject: ALObject | undefined;
var hasALExtensions: boolean;
var currentExtensions: ALExtension[];

export async function activate(context: vscode.ExtensionContext) {
	// console.log("Congratulations, your extension \"al-object-helper\" is now active!");
	//vscode.window.showInformationMessage("Congratulations, your extension \"al-object-helper\" is now active!");

	setIsALExtension(false);

	reader = new Reader(context);
	await reader.start();

	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(textDocumentScheme, new ALObjectHelperDocumentProvider()));
	context.subscriptions.push(vscode.languages.registerDefinitionProvider("al", new ALDefinitionProvider(reader)));
	context.subscriptions.push(vscode.languages.registerHoverProvider("al", new ALHoverProvider(reader)));
	// context.subscriptions.push(vscode.window.registerTreeDataProvider("alObjectHelperObjectList", new ALObjectHelperTreeDataProvider()));

	context.subscriptions.push(vscode.commands.registerCommand("al-object-helper.openALObject", async function () {
		if (reader.autoReloadObjects) {
			await reader.start();
		}

		var alObject: ALObject | undefined;
		if (reader.onlyShowLocalFiles) {
			alObject = await UIManagement.selectALObjectInApps(reader.alApps.filter(a => a.appType === AppType.local));
		}
		else {
			alObject = await UIManagement.selectALObjectInApps(reader.alApps);
		}

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

	context.subscriptions.push(vscode.commands.registerCommand("al-object-helper.openALObjectOfApp", async function () {
		if (reader.autoReloadObjects) {
			await reader.start();
		}

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

	context.subscriptions.push(vscode.commands.registerCommand("al-object-helper.copyEvent", async function () {
		if (reader.autoReloadObjects) {
			await reader.start();
		}

		var alObjects: ALObject[] = [];
		reader.alApps.forEach(alApp => {
			alApp.alObjects.forEach(alObject => {
				alObjects.push(alObject);
			});
		});

		let alObject = await UIManagement.selectALObject(alObjects);
		if (!alObject) {
			return;
		}

		const quickPick = new QuickPickManagement<ALFunctionItem>();
		const picked = quickPick.create(`Select event from ${ObjectType[alObject.objectType]} "${alObject.objectName}" to copy`);

		alObject = await reader.readAlObject(alObject);

		if (!alObject)
			return;

		const alFunctionItems: ALFunctionItem[] = [];
		alObject.functions.filter(alFunction =>
			alFunction.functionType === FunctionType.InternalEvent ||
			alFunction.functionType === FunctionType.BusinessEvent ||
			alFunction.functionType === FunctionType.IntegrationEvent
		).forEach(alFunction => alFunctionItems.push(new ALFunctionItem(alObject!, alFunction, true)));

		quickPick.updateValue(alFunctionItems);
		const alFunctionItem = await picked;

		if (!alFunctionItem) {
			return;
		}

		await vscode.env.clipboard.writeText(alFunctionItem.alFunction.getEventSubscriberText(alObject));
		vscode.window.showInformationMessage("Copied to Clipboard!");
	}));

	context.subscriptions.push(vscode.commands.registerCommand("al-object-helper.jumpToEventSubscriber", async function () {
		if (reader.autoReloadObjects) {
			await reader.readLocalApps(reader.alApps.filter(alApp => alApp.appType === AppType.local));
		}

		const alFunction = await UIManagement.selectEventSubscriber(reader.alApps.filter(alApp => alApp.appType === AppType.local));
		if (!alFunction) {
			return;
		}

		HelperFunctions.openFile(alFunction.alObject, alFunction.alFunction.lineNo);
	}));

	context.subscriptions.push(vscode.commands.registerCommand("al-object-helper.openExtendedObject", async function () {
		if (!currentExtendedObject) {
			return;
		}

		await HelperFunctions.openFile(currentExtendedObject);
	}));

	context.subscriptions.push(vscode.commands.registerCommand("al-object-helper.showObjectExtension", async function () {
		if (currentExtensions.length === 0) {
			return;
		}

		let alObject = await UIManagement.selectALObject(currentExtensions);
		if (!alObject) {
			return;
		}

		await HelperFunctions.openFile(alObject);
	}));

	context.subscriptions.push(vscode.commands.registerCommand("al-object-helper.openALObjectList", async function () {
		//UIManagement.showObjectListPanel(reader.alApps);
	}));

	context.subscriptions.push(vscode.commands.registerCommand("al-object-helper.reload", async function () {
		reader = new Reader(context);
		await reader.start();
	}));

	context.subscriptions.push(vscode.commands.registerCommand("al-object-helper.rereadApp", async function () {
		const alApp = await UIManagement.selectALApp(reader.alApps);
		if (!alApp)
			return;

		const mode = await UIManagement.selectReloadOption();
		if (mode === undefined)
			return;

		if (alApp.appType == AppType.local)
			await reader.readLocalApps([alApp], mode);
		else
			await reader.readAppPackages([alApp], mode);
	}));

	context.subscriptions.push(vscode.commands.registerCommand("al-object-helper.checkLicense", async function () {
		var readLicense = true;

		if (reader.printDebug) {
			reader.outputChannel.appendLine("License Check: Preparing quick panel");
		}

		if (reader.licenseInformation) {
			const selection = await vscode.window.showQuickPick(["New file", `${reader.licenseInformation?.customerName} for BC ${reader.licenseInformation?.productVersion}`]);
			if (!selection) { return; }
			if (selection !== "New file") { readLicense = false; }
		}

		if (readLicense) {
			if (reader.printDebug) {
				reader.outputChannel.appendLine("License Check: Try to read license file");
			}

			const uri = await vscode.window.showOpenDialog({ title: "Select license report detailed", filters: { "Report detailed": ['txt'] }, canSelectMany: false });
			if (!uri) { return; }
			await reader.readLicenseReport(uri[0]);
			vscode.window.showInformationMessage(`Successfully loaded license for ${reader.licenseInformation?.customerName}`);

			if (reader.printDebug) {
				reader.outputChannel.appendLine(`License Check: Read license file. ${reader.licenseInformation?.licenseObjects.length} license objects found`);
			}
		}

		var alObjectsOutOfRange = await reader.checkLicense(false);
		var freeObjects = await reader.getFreeObjects();

		if (reader.printDebug) {
			reader.outputChannel.appendLine(`License Check: Found ${alObjectsOutOfRange.length} objects out of range and ${freeObjects.length} free object ids`);
		}

		UIManagement.showLicenseCheckResult(alObjectsOutOfRange, freeObjects);
	}));

	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((textEditor) => {
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
	}));

	context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(async (workspaceFoldersChange) => {
		for (let i = 0; i < workspaceFoldersChange.removed.length; i++) {
			let appPath = workspaceFoldersChange.removed[i].uri.fsPath;
			if (os.type() == "Windows_NT") {
				if (!appPath.endsWith("\\")) {
					appPath += "\\";
				}
			}
			else {
				if (!appPath.endsWith("/")) {
					appPath += "/";
				}
			}
			const index = reader.alApps.findIndex(alApp => alApp.appRootPath === appPath);
			if (index === -1) {
				continue;
			}

			reader.alApps.splice(index, 1);
		}

		const newApps: ALApp[] = [];
		for (let i = 0; i < workspaceFoldersChange.added.length; i++) {
			const element = workspaceFoldersChange.added[i];
			const alApp = reader.addLocalFolderAsApp(element.uri.fsPath);
			if (!alApp) {
				continue;
			}
			newApps.push(alApp);
		}

		if (newApps.length > 0) {
			await reader.readLocalApps(newApps);
		}
	}));
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