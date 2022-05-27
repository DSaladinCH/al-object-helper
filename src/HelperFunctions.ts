import * as vscode from "vscode";
import { Position, TextDocument } from "vscode";
import path = require("path");
import fs = require("fs-extra");
import JSZip = require("jszip");
import { ALApp, ALExtension, ALFunction, ALObject, ALPage, ALPageExtension, ALPageField, ALTable, ALTableExtension, ALTableField, ALVariable, AppType, extensionPrefix, FunctionType, ObjectType, reader, shortcutRegex } from "./internal";
import lineReader = require("line-reader");

export class HelperFunctions {
    static getObjectTypeFromString(type: string): ObjectType {
        switch (type.toLowerCase()) {
            case "table":
            case "record":
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
                            if (error instanceof Error) {
                                console.log(extensionPrefix + error.message);
                            }
                        }
                    }
                    resolve(alFiles);
                    return;
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log(extensionPrefix + error.message);
                }
                resolve(alFiles);
                return;
            }
        });
    }

    static getLstat(filePath: string): Promise<fs.Stats> {
        return new Promise<fs.Stats>(async (resolve) => {
            fs.lstat(filePath, function (error, stats) {
                resolve(stats);
            });
        });
    }

    static getFileModifyDate(filePath: string): Promise<Date> {
        return new Promise<Date>(async (resolve) => {
            fs.lstat(filePath, (err, stats) => {
                if (err) {
                    resolve(new Date());
                    return;
                }
                resolve(stats.mtime);
            });
        });
    }

    static pathExists(filePath: string): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (err) {
                    resolve(false);
                    return;
                }
                resolve(true);
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

    static async openFile(alObject: ALObject, lineNo?: number): Promise<Boolean> {
        let document: vscode.TextDocument | undefined;
        let editor: vscode.TextEditor | undefined;
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Loading file for object ${alObject.objectName}`
        }, async () => {
            document = await this.getTextDocument(alObject);
            editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.Active);
            return true;
        });

        if (!lineNo || !document || !editor) {
            return true;
        }

        let pos = new vscode.Position(lineNo, document.lineAt(lineNo).text.length);
        editor.selection = new vscode.Selection(pos, pos);
        editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.Default);

        return true;
    }

    static async getTextDocument(alObject: ALObject): Promise<vscode.TextDocument> {
        if (this.isLocalObject(alObject)) {
            return await vscode.workspace.openTextDocument(alObject.objectPath);
        }
        else {
            const objectName = alObject.objectName.replace(/\W/g, "");
            const uri = vscode.Uri.parse(`alObjectHelper:\\\\${alObject.alApp.appName}\\${objectName}.${ObjectType[alObject.objectType]}.al#${JSON.stringify(
                {
                    AppName: alObject.alApp.appName,
                    Type: alObject.objectType,
                    ID: alObject.objectID,
                    Name: alObject.objectName
                })}`);
            return await vscode.workspace.openTextDocument(uri);
        }
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

    static getALObjectByUriFragment(fragment: any): ALObject | undefined {
        let message = JSON.parse(fragment);
        const alApp = reader.alApps.find(alApp => alApp.appName === message.AppName);
        if (!alApp) {
            return undefined;
        }

        return alApp.alObjects.find(f => f.objectType === message.Type && f.objectID === message.ID);
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

                var parent = HelperFunctions.searchALObjectByName(alApps, alObject.parent.objectType, alObject.parent.objectName);
                if (!parent) {
                    continue;
                }

                alObject.parent.objectName = parent.objectName;
                alObject.parent.objectPath = parent.objectPath;
                alObject.parent.objectID = parent.objectID;
                alObject.parent.alApp = parent.alApp;
            }
        });
    }

    static searchALObjectByID(alApps: ALApp[], objectType: ObjectType, objectID: string): ALObject | undefined {
        let alObject: ALObject | undefined;
        alApps.forEach(alApp => {
            alObject = alApp.alObjects.find(alObject => alObject.objectType === objectType && alObject.objectID === objectID);
            if (alObject) {
                return alObject;
            }
        });

        return alObject;
    }

    static searchALObjectByName(alApps: ALApp[], objectType: ObjectType, objectName: string): ALObject | undefined {
        let alObject: ALObject | undefined;
        for (let i = 0; i < alApps.length; i++) {
            const alApp = alApps[i];
            alObject = alApp.alObjects.find(alObject => alObject.objectType === objectType && alObject.objectName === objectName);
            if (alObject) {
                break;
            }
        }

        return alObject;
    }

    static getALObjectOfALVariable(alVariable: ALVariable): ALObject | undefined {
        if (alVariable.dataType === "" || alVariable.subType === "") {
            return undefined;
        }

        const objectType = HelperFunctions.getObjectTypeFromString(alVariable.dataType);
        if (objectType === ObjectType.NotAvailable) {
            return undefined;
        }

        let subType = alVariable.subType;
        if (subType.startsWith("\"")) {
            subType = subType.substring(1);
            subType = subType.substring(0, subType.length - 1);
        }

        // if subtype is a ID
        if (/^[0-9]+$/.test(subType)) {
            return HelperFunctions.searchALObjectByID(reader.alApps, objectType, subType);
        }

        return HelperFunctions.searchALObjectByName(reader.alApps, objectType, subType);
    }

    static getRecOfALObject(alObject: ALObject): ALObject | undefined {
        let tempAlObject: ALObject | undefined;
        switch (alObject.objectType) {
            case ObjectType.Table:
                // if in table, just return table
                tempAlObject = alObject;
            case ObjectType.Page:
                // if in page, return sourcetable
                tempAlObject = (alObject as ALPage).sourceTable;
            case ObjectType.TableExtension:
                // if in tableextension, return parent table
                var parent = (alObject as ALTableExtension).parent;
                if (!parent) { return undefined; }
                tempAlObject = this.getRecOfALObject(parent);
            case ObjectType.PageExtension:
                // if in tableextension, return parent sourcetable
                var parent = (alObject as ALTableExtension).parent;
                if (!parent) { return undefined; }
                tempAlObject = (parent as ALPage).sourceTable;
        }

        if (tempAlObject) {
            return HelperFunctions.searchALObjectByName(reader.alApps, tempAlObject.objectType, alObject.objectName);
        }
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

    static detectDefinitionName(line: string, characterPos: number): { definitionName: string, parentName: string } {
        let startPos = 0;
        let parentStartPos = 0;
        let endPos = 0;
        let parentEndPos = 0;
        let opened = false;
        let inPos = false;
        let hasParent = false;

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
                if (line[startPos - 2] === ".") {
                    if (line[startPos - 3] !== ")") {
                        hasParent = true;
                    }
                }
            }
        }

        if (!inPos) {
            for (let i = characterPos - 1; i >= 0; i--) {
                if ([" ", ",", ".", "("].indexOf(line[i]) !== -1) {
                    if (line[i] === ".") {
                        if (line[i - 1] !== ")") {
                            hasParent = true;
                        }
                    }
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

        if (hasParent) {
            let diff = 2;
            if (inPos) {
                diff = 3;
            }

            if (line[startPos - diff] === "\"") {
                parentEndPos = startPos - diff;
                for (let i = startPos - diff - 1; i >= 0; i--) {
                    if (line[i] === "\"") {
                        parentStartPos = i + 1;
                        break;
                    }
                }
            }
            else {
                parentEndPos = startPos - diff + 1;
                for (let i = startPos - diff; i >= 0; i--) {
                    if ([" ", ",", ".", "("].indexOf(line[i]) !== -1) {
                        parentStartPos = i + 1;
                        break;
                    }
                }
            }
        }

        let definitionName = line.substring(startPos, endPos);
        let parentName = "";
        if (parentStartPos !== 0) {
            parentName = line.substring(parentStartPos, parentEndPos);
        }

        if (definitionName.startsWith("\'") || definitionName.endsWith("\'")) {
            definitionName = "";
        }
        if ((definitionName.startsWith("\"") && !definitionName.endsWith("\"")) || (!definitionName.startsWith("\"") && definitionName.endsWith("\""))) {
            definitionName = "";
        }

        definitionName = HelperFunctions.removeQuotes(definitionName);
        parentName = HelperFunctions.removeQuotes(parentName);

        return { definitionName: definitionName, parentName: parentName };
    }

    static removeQuotes(input: string): string {
        if (input.startsWith("\"")) {
            input = input.substring(1);
        }
        if (input.endsWith("\"")) {
            input = input.substring(0, input.length - 1);
        }

        return input;
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
    static navigateToFields(alObject: ALObject, document: TextDocument, position: Position, definitionName: string): { alObject: ALObject, field: ALTableField | ALPageField } | undefined {
        // Only tables and pages got fields at the moment
        if ([ObjectType.Table, ObjectType.TableExtension, ObjectType.Page, ObjectType.PageExtension].indexOf(alObject.objectType) === -1) {
            return undefined;
        }

        switch (alObject.objectType) {
            case ObjectType.Table:
                return (alObject as ALTable).searchField(definitionName);
            case ObjectType.TableExtension:
                return (alObject as ALTableExtension).searchField(definitionName);
            case ObjectType.Page:
                return (alObject as ALPage).searchField(definitionName);
            case ObjectType.PageExtension:
                return (alObject as ALPageExtension).searchField(definitionName);
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

    static async changeObjectID(sourcePath: string, newObjectID: string): Promise<Boolean> {
        return await new Promise<Boolean>(async (resolve) => {
            var {line, index} = await this.getFirstObjectLine(sourcePath);
            line = reader.replaceObjectID(line, newObjectID);

            if (line === "") {
                resolve(false);
                return;
            }

            var textDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(sourcePath));
            var textEditor = await vscode.window.showTextDocument(textDocument, 1, false);
            await textEditor.edit(textEditorEdit => {
                textEditorEdit.replace(textDocument.lineAt(index).range, line);
                resolve(true);
                return true;
            });

            resolve(false);
            return false;
        });
    }

    private static getFirstObjectLine(objectPath: string): Promise<{ line: string, index: number }> {
        return new Promise<{ line: string, index: number }>((resolve) => {
            var index: number = 0;
            lineReader.eachLine(objectPath, (line, last, cb) => {
                if (reader.readFirstObjectLine(line, objectPath, ALApp.Empty())) {
                    resolve({ line, index });
                    return false;
                }

                if (last) {
                    resolve({ line: "", index: -1 });
                    return false;
                }

                index++;
            });
        });
    }
}