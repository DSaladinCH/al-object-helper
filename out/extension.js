"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.variablePattern = exports.shortcutRegex = exports.extensionPrefix = exports.reader = void 0;
const vscode = require("vscode");
const FunctionType_1 = require("./Function/FunctionType");
const internal_1 = require("./internal");
const Reader_1 = require("./Reader");
const clipboard = require('clipboardy');
exports.extensionPrefix = "AL Object Helper: ";
exports.shortcutRegex = RegExp("^((?:t|p|e|r)(?:e|ed)?|(?:c|x|q))([0-9]+)$", "mi");
exports.variablePattern = /\s(\"[^\"\r\n\t]+\"|[a-z0-9\_]+)\s?\:\s([a-z\[\]0-9]+)\s?(\'[^\'\;]+\'|\"[^\"\;]+\"|of [^\"\;]+|[^\"\s\;]+|)( temporary)?\;/i;
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        // Use the console to output diagnostic information (console.log) and errors (console.error)
        // This line of code will only be executed once when your extension is activated
        console.log('Congratulations, your extension "al-object-helper" is now active!');
        vscode.window.showInformationMessage("Congratulations, your extension \"al-object-helper\" is now active!");
        context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('alObjectHelper', new internal_1.ALObjectHelperDocumentProvider()));
        exports.reader = new Reader_1.Reader(context);
        yield exports.reader.startReading();
        vscode.languages.registerDefinitionProvider('al', new internal_1.ALDefinitionProvider(exports.reader));
        vscode.languages.registerHoverProvider('al', new internal_1.ALHoverProvider(exports.reader));
        context.subscriptions.push(vscode.commands.registerCommand('al-object-helper.openALFile', function () {
            return __awaiter(this, void 0, void 0, function* () {
                var alObjects = [];
                exports.reader.alApps.forEach(alApp => {
                    alApp.alObjects.forEach(alObject => {
                        alObjects.push(new internal_1.ALObjectItem(alObject));
                    });
                });
                const quickPick = vscode.window.createQuickPick();
                quickPick.items = alObjects;
                quickPick.placeholder = "Search for a Object or use shortcut";
                quickPick.matchOnDescription = true;
                quickPick.matchOnDetail = true;
                quickPick.onDidChangeValue(function (e) {
                    // check if input (e) is a object type shortcut
                    // if yes insert it a quickitem
                    // else remove the quickitem
                    if (exports.shortcutRegex.test(e)) {
                        if (alObjects.length > 0 && alObjects[0].isTemporary) {
                            // Modify first item
                            alObjects[0].label = e.toLowerCase();
                        }
                        else {
                            // Add first item
                            alObjects = [internal_1.ALObjectItem.createShortcutItem(e)].concat(alObjects);
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
                quickPick.onDidAccept(function (event) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const alObjectItem = quickPick.selectedItems[0];
                        if (alObjectItem.isTemporary) {
                            // open file with shortcut
                            if (!(yield internal_1.HelperFunctions.openFileWithShortcut(alObjectItem.label))) {
                                vscode.window.showWarningMessage(exports.extensionPrefix + `Could not open the shortcut ${alObjectItem.label}`);
                            }
                        }
                        else {
                            // open file from path
                            if (!(yield internal_1.HelperFunctions.openFile(alObjectItem.alObject))) {
                                vscode.window.showWarningMessage(exports.extensionPrefix + `Could not open the object with id ${alObjectItem.alObject.objectID}`);
                            }
                        }
                    });
                });
                quickPick.show();
            });
        }));
        context.subscriptions.push(vscode.commands.registerCommand('al-object-helper.copyEvent', function () {
            return __awaiter(this, void 0, void 0, function* () {
                var alObjects = [];
                exports.reader.alApps.forEach(alApp => {
                    alApp.alObjects.forEach(alObject => {
                        if (alObject.functions.find(alFunction => alFunction.functionType === FunctionType_1.FunctionType.InternalEvent ||
                            alFunction.functionType === FunctionType_1.FunctionType.BusinessEvent ||
                            alFunction.functionType === FunctionType_1.FunctionType.IntegrationEvent)) {
                            alObjects.push(new internal_1.ALObjectItem(alObject));
                        }
                    });
                });
                const quickPick = vscode.window.createQuickPick();
                quickPick.items = alObjects;
                quickPick.placeholder = "Search for a Object or use shortcut";
                quickPick.matchOnDescription = true;
                quickPick.matchOnDetail = true;
                quickPick.onDidAccept(function (event) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const alObjectItem = quickPick.selectedItems[0];
                        const events = [];
                        const functions = alObjectItem.alObject.functions.filter(alFunction => alFunction.functionType === FunctionType_1.FunctionType.InternalEvent ||
                            alFunction.functionType === FunctionType_1.FunctionType.BusinessEvent ||
                            alFunction.functionType === FunctionType_1.FunctionType.IntegrationEvent);
                        functions.forEach(alFunction => events.push(new internal_1.ALEventPublisherItem(alFunction)));
                        vscode.window.showQuickPick(events, { placeHolder: `Select event from ${internal_1.ObjectType[alObjectItem.alObject.objectType]} "${alObjectItem.alObject.objectName}" to copy` }).then((value) => {
                            if (value === undefined) {
                                return;
                            }
                            clipboard.writeSync(value.alFunction.getEventSubscriberText(alObjectItem.alObject));
                            vscode.window.showInformationMessage("Copied to Clipboard!");
                        });
                    });
                });
                quickPick.show();
            });
        }));
    });
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map