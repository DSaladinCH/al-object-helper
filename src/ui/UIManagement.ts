import * as vscode from "vscode";
import * as fs from "fs";
import path = require("path");
import { ALApp, ALAppItem, ALFunction, ALFunctionItem, ALObject, ALObjectItem, FunctionType, ObjectType, reader, shortcutRegex } from "../internal";
import { resolve } from "path";

export class UIManagement {
    static async selectALApp(alApps: ALApp[]): Promise<ALApp | undefined> {
        var alAppItems: ALAppItem[] = [];
        alApps.forEach(alApp => {
            alAppItems.push(new ALAppItem(alApp));
        });

        const selectedItem = await vscode.window.showQuickPick(alAppItems, { placeHolder: "Search for a AL App", matchOnDescription: true });
        if (!selectedItem) {
            return undefined;
        }

        return selectedItem.alApp;
    }

    static async selectALObjectInApp(alApp: ALApp): Promise<ALObject | undefined> {
        var alObjectItems: ALObjectItem[] = [];
        alApp.alObjects.forEach(alObject => {
            alObjectItems.push(new ALObjectItem(alObject));
        });

        return await this.showALObjectDialog(alObjectItems);
    }

    static async selectALObjectInApps(alApps: ALApp[]): Promise<ALObject | undefined> {
        var alObjectItems: ALObjectItem[] = [];
        alApps.forEach(alApp => {
            const realALApp = reader.alApps.find(a => a.appName === alApp.appName);
            if (realALApp){
                realALApp.alObjects.forEach(alObject => {
                    alObjectItems.push(new ALObjectItem(alObject));
                });
            }
        });

        return await this.showALObjectDialog(alObjectItems);
    }

    static async selectALObject(alObjects: ALObject[]): Promise<ALObject | undefined> {
        let alObjectItems: ALObjectItem[] = [];
        alObjects.forEach(alObject => {
            alObjectItems.push(new ALObjectItem(alObject));
        });

        return await this.showALObjectDialog(alObjectItems);
    }

    private static async showALObjectDialog(alObjectItems: ALObjectItem[]): Promise<ALObject | undefined> {
        return new Promise<ALObject | undefined>(async (resolve) => {
            const quickPick: vscode.QuickPick<vscode.QuickPickItem> = vscode.window.createQuickPick();
            quickPick.items = alObjectItems;
            quickPick.placeholder = "Search for a Object or use shortcut";
            quickPick.matchOnDescription = true;
            quickPick.matchOnDetail = true;
            let accepted = false;

            quickPick.onDidChangeValue((searchValue) => {
                // check if input (e) is a object type shortcut
                // if yes insert it a quickitem
                // else remove the quickitem
                if (shortcutRegex.test(searchValue)) {
                    if (alObjectItems.length > 0 && alObjectItems[0].isTemporary) {
                        // Modify first item
                        alObjectItems[0].label = searchValue.toLowerCase();
                    }
                    else {
                        // Add first item
                        alObjectItems = [ALObjectItem.createShortcutItem(searchValue)].concat(alObjectItems);
                    }
                }
                else {
                    if (alObjectItems[0].isTemporary) {
                        // Remove item
                        alObjectItems.shift();
                    }
                }
                quickPick.items = alObjectItems;
            });

            quickPick.onDidAccept((event) => {
                accepted = true;
                quickPick.hide();
            });

            quickPick.onDidHide(async (event) => {
                if (quickPick.selectedItems.length === 0 || !accepted) {
                    resolve(undefined);
                    return undefined;
                }
                else {
                    const alObjectItem = quickPick.selectedItems[0] as ALObjectItem;
                    if (alObjectItem.isTemporary) {
                        // open file with shortcut
                        const alObjects = ALObject.getByShortcut(alObjectItem.label);
                        if (!alObjects) {
                            resolve(undefined);
                            return undefined;
                        }

                        if (alObjects.length === 1) {
                            resolve(alObjects[0]);
                            return alObjects[0];
                        }

                        const alObject = await UIManagement.selectALObject(alObjects);
                        resolve(alObject);
                        return alObject;
                    }
                    else {
                        // open file from path
                        resolve(alObjectItem.alObject);
                        return alObjectItem.alObject;
                    }
                }
            });

            quickPick.show();
        });
    }

    static async selectEventPublisher(alObject: ALObject): Promise<ALFunction | undefined> {
        const alFunctionItems: ALFunctionItem[] = [];
        alObject.functions.filter(alFunction =>
            alFunction.functionType === FunctionType.InternalEvent ||
            alFunction.functionType === FunctionType.BusinessEvent ||
            alFunction.functionType === FunctionType.IntegrationEvent
        ).forEach(alFunction => alFunctionItems.push(new ALFunctionItem(alObject, alFunction, true)));

        const alFunction = await UIManagement.showFunctionDialog(alFunctionItems, `Select event from ${ObjectType[alObject.objectType]} "${alObject.objectName}" to copy`);
        if (!alFunction) {
            return undefined;
        }
        return alFunction.alFunction;
    }

    static async selectEventSubscriber(alApps: ALApp[]): Promise<{ alObject: ALObject, alFunction: ALFunction } | undefined> {
        const alFunctionItems: ALFunctionItem[] = [];
        alApps.forEach(alApp => {
            alApp.alObjects.forEach(alObject => {
                alObject.functions.filter(alFunction => alFunction.functionType === FunctionType.EventSubscriber).forEach(
                    alFunction => alFunctionItems.push(new ALFunctionItem(alObject, alFunction, true))
                );
            });
        });

        const alFunction = await UIManagement.showFunctionDialog(alFunctionItems, "Select event subscriber to jump to");
        if (!alFunction) {
            return undefined;
        }
        return { alObject: alFunction.alObject, alFunction: alFunction.alFunction };
    }

    private static async showFunctionDialog(alFunctionItems: ALFunctionItem[], placeholderText: string): Promise<ALFunctionItem | undefined> {
        return new Promise<ALFunctionItem | undefined>((resolve) => {
            const quickPick: vscode.QuickPick<vscode.QuickPickItem> = vscode.window.createQuickPick();
            quickPick.items = alFunctionItems;
            quickPick.placeholder = placeholderText;
            quickPick.matchOnDescription = true;
            quickPick.matchOnDetail = true;
            let accepted = false;

            quickPick.onDidAccept((event) => {
                accepted = true;
                quickPick.hide();
            });

            quickPick.onDidHide((event) => {
                if (quickPick.selectedItems.length === 0 || !accepted) {
                    resolve(undefined);
                    return undefined;
                }
                else {
                    resolve(quickPick.selectedItems[0] as ALFunctionItem);
                    return quickPick.selectedItems[0] as ALFunctionItem;
                }
            });

            quickPick.show();
        });
    }

    static async showObjectListPanel(alApps: ALApp[]) {
        // Create and show panel
        const panel = vscode.window.createWebviewPanel(
            'alObjectList',
            'AL Object List',
            vscode.ViewColumn.One,
            {}
        );

        // And set its HTML content
        panel.webview.html = await this.getWebviewContent();
    }

    private static async getWebviewContent(): Promise<string> {
        return new Promise<string>((resolve) => {
            // Get path to resource on disk
            // And get the special URI to use with the webview
            const htmlOnDiskPath = vscode.Uri.file(path.join(reader.extensionContext.extensionPath, 'src', 'ui', 'objectlist', 'index.html'));
            //const appOnDiskPath = vscode.Uri.file(path.join(this._extensionPath, 'designer', 'scripts', 'vendor-bundle.js'));
            //const appJsSrc: any = this._panel.webview.asWebviewUri(appOnDiskPath);

            fs.readFile(htmlOnDiskPath.fsPath, (error, data) => {
                if (error) {
                    resolve("");
                    return "";
                }

                let content = data.toString();
                // content = content.replace('scripts/vendor-bundle.js', appJsSrc);
                // content = content.replace('${panelMode}', this.panelMode);
                // content = content.replace('${objectInfo}', JSON.stringify(this.objectInfo));
                resolve(content);
                return content;
            });
        });
    }
}