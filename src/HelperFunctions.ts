import * as vscode from 'vscode';
import { Position, TextDocument } from 'vscode';
import path = require("path");
import fs = require("fs-extra");
import JSZip = require("jszip");
import { ALApp, ALExtension, ALFunction, ALObject, ALPage, ALPageExtension, ALPageField, ALTable, ALTableExtension, ALTableField, ALVariable, AppType, extensionPrefix, FunctionType, ObjectType, reader, shortcutRegex } from "./internal";

export class HelperFunctions {
    static getObjectTypeFromString(type: string): ObjectType {
        switch (type.toLowerCase()) {
            case "table":
                return ObjectType.Table;
            case "tableextension":
                return ObjectType.TableExtension;
            case "page":
                return ObjectType.Page;
            case "pageextension":
                return ObjectType.PageExtension;
            case "codeunit":
                return ObjectType.Codeunit;
            case "xmlport":
                return ObjectType.Xmlport;
            case "report":
                return ObjectType.Report;
            case "reportextension":
                return ObjectType.ReportExtension;
            case "query":
                return ObjectType.Query;
            case "enum":
                return ObjectType.Enum;
            case "enumextension":
                return ObjectType.EnumExtension;
            default:
                console.info(extensionPrefix + `Type "${type}" is not available`);
                return ObjectType.NotAvailable;
            //throw new Error(extensionPrefix + `Type "${type}" is not available`);
        }
    }

    static removeNameSurrounding(name: string): string {
        if (name.startsWith("\"")) {
            name = name.substring(1);
            name = name.substring(0, name.length - 1);
        }
        return name;
    }

    /**
     * Get all files in a directory (also nested) with a certain extension
     * @param dirPath Directory path to search in
     * @param extension The extension which should be search
     * @returns All file paths
     */
    static async getFiles(dirPath: string, extension: string): Promise<string[]> {
        if (!extension.startsWith('.')) {
            extension = '.' + extension;
        }

        return await HelperFunctions.searchFiles(dirPath, extension);
    }

    private static searchFiles(dirPath: string, extension: string): Promise<string[]> {
        return new Promise<string[]>(async (resolve) => {
            let alFiles: string[] = [];

            if (!await HelperFunctions.gotPathAccess(dirPath)) {
                resolve(alFiles);
                return;
            }

            try {
                fs.readdir(dirPath, async function (error, files) {
                    if (error) {
                        console.log(extensionPrefix + error.message);
                        resolve(alFiles);
                        return alFiles;
                    }

                    if (files === undefined) {
                        resolve(alFiles);
                        return alFiles;
                    }

                    // for await (let fileName of files){
                    //     // const fileName = files[i];
                    //     try {
                    //         const filePath = path.join(dirPath, fileName);
                    //         const stats = await HelperFunctions.getLstat(filePath);
                    //         if (stats === undefined) {
                    //             continue;
                    //         }

                    //         if (stats.isDirectory()) {
                    //             alFiles = alFiles.concat(await HelperFunctions.searchFiles(filePath, extension));
                    //         }
                    //         else if (fileName.endsWith(extension)) {
                    //             console.log(`Found file "${fileName}"`);
                    //             alFiles.push(filePath);
                    //         }
                    //     }
                    //     catch (error) {
                    //         console.log(extensionPrefix + error.message);
                    //     }
                    // }
                    for (let i = 0; i < files.length; i++) {
                        const fileName = files[i];
                        try {
                            const filePath = path.join(dirPath, fileName);
                            const stats = await HelperFunctions.getLstat(filePath);
                            if (stats === undefined) {
                                continue;
                            }

                            if (stats.isDirectory()) {
                                alFiles = alFiles.concat(await HelperFunctions.searchFiles(filePath, extension));
                            }
                            else if (fileName.endsWith(extension)) {
                                // console.log(`Found file "${fileName}"`);
                                alFiles.push(filePath);
                            }
                        }
                        catch (error) {
                            console.log(extensionPrefix + error.message);
                        }
                    }
                    resolve(alFiles);
                    return;
                });
            }
            catch (error) {
                console.log(extensionPrefix + error.message);
                resolve(alFiles);
                return;
            }
        });
    }

    static getLstat(filePath: string): Promise<fs.Stats> {
        return new Promise<fs.Stats>(async (resolve) => {
            await fs.lstat(filePath, function (error, stats) {
                resolve(stats);
            });
        });
    }

    static gotPathAccess(path: string): Promise<Boolean> {
        return new Promise<Boolean>(async (resolve) => {
            await fs.access(path, function (error) {
                if (error) {
                    resolve(false);
                    return;
                }
                resolve(true);
            });
        });
    }

    static getTypeByShortcut(shortcut: string): ObjectType | undefined {
        switch (shortcut.toLowerCase()) {
            case 't':
                return ObjectType.Table;
            case 'te':
            case 'ted':
                return ObjectType.TableExtension;
            case 'p':
                return ObjectType.Page;
            case 'pe':
            case 'ped':
                return ObjectType.PageExtension;
            case 'e':
                return ObjectType.Enum;
            case 'ee':
            case 'eed':
                return ObjectType.EnumExtension;
            case 'r':
                return ObjectType.Report;
            case 're':
            case 'red':
                return ObjectType.ReportExtension;
            case 'c':
                return ObjectType.Codeunit;
            case 'x':
                return ObjectType.Xmlport;
            case 'q':
                return ObjectType.Query;
            default:
                return undefined;
        }
    }

    static getFunctionTypeByString(functionType: string): FunctionType | undefined {
        switch (functionType.toLowerCase()) {
            case "procedure":
                return FunctionType.Standard;
            case "trigger":
                return FunctionType.Trigger;
            case "businessevent":
                return FunctionType.BusinessEvent;
            case "integrationevent":
                return FunctionType.IntegrationEvent;
            default:
                return undefined;
        }
    }

    static async openFileWithShortcut(shortcutText: string): Promise<Boolean> {
        let matches: RegExpMatchArray | null = shortcutText.toLowerCase().match(shortcutRegex.source);
        if (!matches || matches.length < 3) {
            return false;
        }
        let objectType: ObjectType | undefined = HelperFunctions.getTypeByShortcut(matches[1]);
        let searchExtension: boolean = (matches[1].length === 2 && matches[1].toLowerCase().endsWith("e"));
        let objectID: string = matches[2];
        if (objectType === undefined) {
            return false;
        }
        let alObjects: ALObject[] = [];
        if (!searchExtension) {
            reader.alApps.forEach(alApp => {
                alObjects = alObjects.concat(alApp.alObjects.filter(a => a.objectType === objectType && a.objectID === objectID));
            });
            //alObjects = reader.alObjects.filter(a => a.objectType === objectType && a.objectID === objectID);
        }
        else {
            reader.alApps.forEach(alApp => {
                alObjects = alObjects.concat(alApp.alObjects.filter(a => a.objectType === objectType));
            });
            //alObjects = reader.alObjects.filter(a => a.objectType === objectType);
            alObjects = (alObjects as ALExtension[]).filter(a => a.parent?.objectID === objectID);
        }

        if (!alObjects || alObjects.length === 0) {
            return false;
        }

        if (alObjects.length === 1) {
            return await this.openFile(alObjects[0]);
        }

        // TODO: show dialog to select an object
        return true;
    }

    static async openFile(alObject: ALObject): Promise<Boolean> {
        let document: vscode.TextDocument;
        if (this.isLocalObject(alObject)) {
            document = await vscode.workspace.openTextDocument(alObject.objectPath);
        }
        else {
            const objectName = alObject.objectName.replace(/\W/g, "");
            const uri = vscode.Uri.parse(`alObjectHelper:\\\\AOH\\${alObject.alApp.appName}\\${objectName}.${ObjectType[alObject.objectType]}.dal#${JSON.stringify(
                {
                    AppName: alObject.alApp.appName,
                    Type: alObject.objectType,
                    ID: alObject.objectID,
                    Name: alObject.objectName
                })}`);
            document = await vscode.workspace.openTextDocument(uri);
        }

        await vscode.window.showTextDocument(document, vscode.ViewColumn.Active);
        return true;
    }

    static async openUriFile(uri: vscode.Uri, lineNo?: number) {
        let document = await vscode.workspace.openTextDocument(uri);
        let editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.Active);

        if (!lineNo) {
            return;
        }

        let pos = new vscode.Position(lineNo, document.lineAt(lineNo).text.length);
        editor.selection = new vscode.Selection(pos, pos);
        editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.Default);
    }

    static isLocalObject(alObject: ALObject): boolean {
        const alApp = reader.alApps.find(a => a.appName === alObject.alApp.appName);
        if (!alApp) {
            return false;
        }

        return alApp.appType === AppType.local;
    }

    static getZipPath(alObject: ALObject): string | undefined {
        let alApp: ALApp | undefined = reader.alApps.find(a => a.appName === alObject.alApp.appName);
        if (!alApp || alApp.appType !== AppType.appPackage) {
            return;
        }

        return alApp.appPath;
    }

    static async readZip(zipPath: string): Promise<JSZip | undefined> {
        return new Promise<JSZip | undefined>((resolve, reject) => {
            try {
                new JSZip.external.Promise(function (resolve: any, reject: any) {
                    fs.readFile(zipPath, function (error: NodeJS.ErrnoException, data: Buffer) {
                        if (error) {
                            resolve(undefined);
                        } else {
                            resolve(data);
                        }
                    });
                }).then(async function (data: any) {
                    return await JSZip.loadAsync(data, {});
                }).then((data: any) => {
                    resolve(data);
                }, (reason: any) => {
                    resolve(undefined);
                });
            }
            catch (error) {
                resolve(undefined);
            }
        });
    }

    static fillParentObjects(alApps: ALApp[]) {
        alApps.forEach(alApp => {
            var alObjects = (alApp.alObjects.filter(alObject => alObject.isExtension()) as ALExtension[]);
            for (let index = 0; index < alObjects.length; index++) {
                var alObject = alObjects[index];
                if (!alObject.parent) {
                    continue;
                }

                const parent = HelperFunctions.searchALObjectByName(alApps, alObject.parent.objectType, alObject.parent.objectName);
                if (!parent) {
                    continue;
                }

                alObject.parent.objectName = parent.objectName;
                alObject.parent.objectPath = parent.objectPath;
            }
            // (alApp.alObjects.filter(alObject => alObject.isExtension()) as ALExtension[]).forEach(alObject => {
            //     if (!alObject.parent){
            //         continue;
            //     }
            //     const parent = HelperFunctions.searchALObjectByName(alApps, alObject.parent.objectType, alObject.parent.objectName);
            // });
        });
    }

    static searchALObjectByID(alApps: ALApp[], objectType: ObjectType, objectID: string): ALObject | undefined {
        alApps.forEach(alApp => {
            const alObject = alApp.alObjects.find(alObject => alObject.objectType === objectType && alObject.objectID === objectID);
            if (alObject) {
                return alObject;
            }
        });

        return undefined;
    }

    static searchALObjectByName(alApps: ALApp[], objectType: ObjectType, objectName: string): ALObject | undefined {
        alApps.forEach(alApp => {
            const alObject = alApp.alObjects.find(alObject => alObject.objectType === objectType && alObject.objectName === objectName);
            if (alObject) {
                return alObject;
            }
        });

        return undefined;
    }

    //#region Definition / Hover Provider
    static getCurrentALObjectByUri(document: TextDocument): ALObject | undefined {
        const uri = document.uri;
        const message = JSON.parse(uri.fragment);
        const alApp = reader.alApps.find(alApp => alApp.appName === message.AppName);
        if (!alApp) {
            return undefined;
        }

        return alApp.alObjects.find(alObject => alObject.objectType === message.Type && alObject.objectID === message.ID);
    }

    static detectDefinitionName(line: string, characterPos: number): string {
        let startPos = 0;
        let endPos = 0;
        let opened = false;
        let inPos = false;

        for (let i = 0; i < line.length; i++) {
            // if variable got opened by " and the character position is inside the ", then the variable got multiple words
            if (line[i] === "\"") {
                if (!opened) {
                    startPos = i + 1;
                }
                opened = !opened;

                // now closed
                if (!opened && inPos) {
                    endPos = i;
                    break;
                }
            }

            if (opened && i === characterPos - 1) {
                inPos = true;
            }
        }

        if (!inPos) {
            for (let i = characterPos - 1; i >= 0; i--) {
                if ([" ", ",", ".", "("].indexOf(line[i]) !== -1) {
                    startPos = i + 1;
                    break;
                }
            }

            for (let i = characterPos; i < line.length; i++) {
                if ([" ", ",", ".", "(", ")", ";"].indexOf(line[i]) !== -1) {
                    endPos = i;
                    break;
                }
            }
        }

        let definitionName = line.substring(startPos, endPos);
        if (definitionName.startsWith("\'") || definitionName.endsWith("\'")) {
            definitionName = "";
        }
        if ((definitionName.startsWith("\"") && !definitionName.endsWith("\"")) || (!definitionName.startsWith("\"") && definitionName.endsWith("\""))) {
            definitionName = "";
        }

        return definitionName;
    }

    /**
     * Search for the next global al variable inside a specific al object
     * @param alObject The current al object
     * @param document The current al file
     * @param position The current position in the al file
     * @param definitionName The definition name to search for
     * @returns The found al variable or undefined (not found)
     */
    static navigateToGlobalVariable(alObject: ALObject, document: TextDocument, position: Position, definitionName: string): ALVariable | undefined {
        const alVariable = alObject.variables.find(alVariable => alVariable.variableName === definitionName);
        return alVariable;
    }

    /**
     * Search for a table or page field inside a specific al object
     * @param alObject The current al object
     * @param document The current al file
     * @param position The current position in the al file
     * @param definitionName The definition name to search for
     * @returns The found al table field, al page field or undefined (not found)
     */
    static navigateToFields(alObject: ALObject, document: TextDocument, position: Position, definitionName: string): ALTableField | ALPageField | undefined {
        // Only tables and pages got fields at the moment
        if ([ObjectType.Table, ObjectType.TableExtension, ObjectType.Page, ObjectType.PageExtension].indexOf(alObject.objectType) === -1) {
            return undefined;
        }

        switch (alObject.objectType) {
            case ObjectType.Table:
                return (alObject as ALTable).fields.find(alField => alField.fieldName === definitionName);
            case ObjectType.TableExtension:
                return (alObject as ALTableExtension).fields.find(alField => alField.fieldName === definitionName);
            case ObjectType.Page:
                return (alObject as ALPage).fields.find(alField => alField.fieldName === definitionName);
            case ObjectType.PageExtension:
                return (alObject as ALPageExtension).fields.find(alField => alField.fieldName === definitionName);
        }

        return undefined;
    }

    /**
     * Search for next the al function or al variable inside a specific al object (check if inside of a function)
     * @param alObject The current al object
     * @param document The current al file
     * @param position The current position in the al file
     * @param definitionName The definition name to search for
     * @returns The found al function, al variable or undefined (not found)
     */
    static navigateToNextLocalFunction(alObject: ALObject, document: TextDocument, position: Position, definitionName: string): ALFunction | ALVariable | undefined {
        const alFunctions = alObject.functions.filter(alFunction => alFunction.lineNo < position.line);
        if (alFunctions.length === 0) {
            return undefined;
        }

        const nextALFunction = alFunctions[alFunctions.length - 1];
        if (nextALFunction.functionName === definitionName) {
            return nextALFunction;
            // return { uri: document.uri, lineNo: nextALFunction.lineNo };
        }

        let alVariable = nextALFunction.variables.find(alVariable => alVariable.variableName === definitionName);
        if (alVariable) {
            return alVariable;
            // return { uri: document.uri, lineNo: alVariable.lineNo };
        }

        alVariable = nextALFunction.parameters.find(alVariable => alVariable.variableName === definitionName);
        if (alVariable) {
            return alVariable;
            // return { uri: document.uri, lineNo: alVariable.lineNo };
        }

        return undefined;
    }

    /**
     * Search for any function inside a specific al object
     * @param alObject The current al object
     * @param document The current al file
     * @param position The current position in the al file
     * @param definitionName The definition name to search for
     * @returns The found al function or undefined (not found)
     */
    static navigateToLocalFunction(alObject: ALObject, document: TextDocument, position: Position, definitionName: string): ALFunction | undefined {
        const alFunction = alObject.functions.find(alFunction => alFunction.functionName === definitionName);
        return alFunction;
    }
    //#endregion
}