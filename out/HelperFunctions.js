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
exports.HelperFunctions = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs-extra");
const JSZip = require("jszip");
const internal_1 = require("./internal");
class HelperFunctions {
    static getObjectTypeFromString(type) {
        switch (type.toLowerCase()) {
            case "table":
                return internal_1.ObjectType.Table;
            case "tableextension":
                return internal_1.ObjectType.TableExtension;
            case "page":
                return internal_1.ObjectType.Page;
            case "pageextension":
                return internal_1.ObjectType.PageExtension;
            case "codeunit":
                return internal_1.ObjectType.Codeunit;
            case "xmlport":
                return internal_1.ObjectType.Xmlport;
            case "report":
                return internal_1.ObjectType.Report;
            case "reportextension":
                return internal_1.ObjectType.ReportExtension;
            case "query":
                return internal_1.ObjectType.Query;
            case "enum":
                return internal_1.ObjectType.Enum;
            case "enumextension":
                return internal_1.ObjectType.EnumExtension;
            default:
                console.info(internal_1.extensionPrefix + `Type "${type}" is not available`);
                return internal_1.ObjectType.NotAvailable;
            //throw new Error(extensionPrefix + `Type "${type}" is not available`);
        }
    }
    static removeNameSurrounding(name) {
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
    static getFiles(dirPath, extension) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!extension.startsWith('.')) {
                extension = '.' + extension;
            }
            return yield HelperFunctions.searchFiles(dirPath, extension);
        });
    }
    static searchFiles(dirPath, extension) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let alFiles = [];
            if (!(yield HelperFunctions.gotPathAccess(dirPath))) {
                resolve(alFiles);
                return;
            }
            try {
                fs.readdir(dirPath, function (error, files) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (error) {
                            console.log(internal_1.extensionPrefix + error.message);
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
                                const stats = yield HelperFunctions.getLstat(filePath);
                                if (stats === undefined) {
                                    continue;
                                }
                                if (stats.isDirectory()) {
                                    alFiles = alFiles.concat(yield HelperFunctions.searchFiles(filePath, extension));
                                }
                                else if (fileName.endsWith(extension)) {
                                    // console.log(`Found file "${fileName}"`);
                                    alFiles.push(filePath);
                                }
                            }
                            catch (error) {
                                console.log(internal_1.extensionPrefix + error.message);
                            }
                        }
                        resolve(alFiles);
                        return;
                    });
                });
            }
            catch (error) {
                console.log(internal_1.extensionPrefix + error.message);
                resolve(alFiles);
                return;
            }
        }));
    }
    static getLstat(filePath) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            yield fs.lstat(filePath, function (error, stats) {
                resolve(stats);
            });
        }));
    }
    static gotPathAccess(path) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            yield fs.access(path, function (error) {
                if (error) {
                    resolve(false);
                    return;
                }
                resolve(true);
            });
        }));
    }
    static getTypeByShortcut(shortcut) {
        switch (shortcut.toLowerCase()) {
            case 't':
                return internal_1.ObjectType.Table;
            case 'te':
            case 'ted':
                return internal_1.ObjectType.TableExtension;
            case 'p':
                return internal_1.ObjectType.Page;
            case 'pe':
            case 'ped':
                return internal_1.ObjectType.PageExtension;
            case 'e':
                return internal_1.ObjectType.Enum;
            case 'ee':
            case 'eed':
                return internal_1.ObjectType.EnumExtension;
            case 'r':
                return internal_1.ObjectType.Report;
            case 're':
            case 'red':
                return internal_1.ObjectType.ReportExtension;
            case 'c':
                return internal_1.ObjectType.Codeunit;
            case 'x':
                return internal_1.ObjectType.Xmlport;
            case 'q':
                return internal_1.ObjectType.Query;
            default:
                return undefined;
        }
    }
    static getFunctionTypeByString(functionType) {
        switch (functionType.toLowerCase()) {
            case "procedure":
                return internal_1.FunctionType.Standard;
            case "trigger":
                return internal_1.FunctionType.Trigger;
            case "businessevent":
                return internal_1.FunctionType.BusinessEvent;
            case "integrationevent":
                return internal_1.FunctionType.IntegrationEvent;
            default:
                return undefined;
        }
    }
    static openFileWithShortcut(shortcutText) {
        return __awaiter(this, void 0, void 0, function* () {
            let matches = shortcutText.toLowerCase().match(internal_1.shortcutRegex.source);
            if (!matches || matches.length < 3) {
                return false;
            }
            let objectType = HelperFunctions.getTypeByShortcut(matches[1]);
            let searchExtension = (matches[1].length === 2 && matches[1].toLowerCase().endsWith("e"));
            let objectID = matches[2];
            if (objectType === undefined) {
                return false;
            }
            let alObjects = [];
            if (!searchExtension) {
                internal_1.reader.alApps.forEach(alApp => {
                    alObjects = alObjects.concat(alApp.alObjects.filter(a => a.objectType === objectType && a.objectID === objectID));
                });
                //alObjects = reader.alObjects.filter(a => a.objectType === objectType && a.objectID === objectID);
            }
            else {
                internal_1.reader.alApps.forEach(alApp => {
                    alObjects = alObjects.concat(alApp.alObjects.filter(a => a.objectType === objectType));
                });
                //alObjects = reader.alObjects.filter(a => a.objectType === objectType);
                alObjects = alObjects.filter(a => { var _a; return ((_a = a.parent) === null || _a === void 0 ? void 0 : _a.objectID) === objectID; });
            }
            if (!alObjects || alObjects.length === 0) {
                return false;
            }
            if (alObjects.length === 1) {
                return yield this.openFile(alObjects[0]);
            }
            // TODO: show dialog to select an object
            return true;
        });
    }
    static openFile(alObject) {
        return __awaiter(this, void 0, void 0, function* () {
            let document;
            if (this.isLocalObject(alObject)) {
                document = yield vscode.workspace.openTextDocument(alObject.objectPath);
            }
            else {
                const objectName = alObject.objectName.replace(/\W/g, "");
                const uri = vscode.Uri.parse(`alObjectHelper:\\\\AOH\\${alObject.alApp.appName}\\${objectName}.${internal_1.ObjectType[alObject.objectType]}.dal#${JSON.stringify({
                    AppName: alObject.alApp.appName,
                    Type: alObject.objectType,
                    ID: alObject.objectID,
                    Name: alObject.objectName
                })}`);
                document = yield vscode.workspace.openTextDocument(uri);
            }
            yield vscode.window.showTextDocument(document, vscode.ViewColumn.Active);
            return true;
        });
    }
    static openUriFile(uri, lineNo) {
        return __awaiter(this, void 0, void 0, function* () {
            let document = yield vscode.workspace.openTextDocument(uri);
            let editor = yield vscode.window.showTextDocument(document, vscode.ViewColumn.Active);
            if (!lineNo) {
                return;
            }
            let pos = new vscode.Position(lineNo, document.lineAt(lineNo).text.length);
            editor.selection = new vscode.Selection(pos, pos);
            editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.Default);
        });
    }
    static isLocalObject(alObject) {
        const alApp = internal_1.reader.alApps.find(a => a.appName === alObject.alApp.appName);
        if (!alApp) {
            return false;
        }
        return alApp.appType === internal_1.AppType.local;
    }
    static getZipPath(alObject) {
        let alApp = internal_1.reader.alApps.find(a => a.appName === alObject.alApp.appName);
        if (!alApp || alApp.appType !== internal_1.AppType.appPackage) {
            return;
        }
        return alApp.appPath;
    }
    static readZip(zipPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    new JSZip.external.Promise(function (resolve, reject) {
                        fs.readFile(zipPath, function (error, data) {
                            if (error) {
                                resolve(undefined);
                            }
                            else {
                                resolve(data);
                            }
                        });
                    }).then(function (data) {
                        return __awaiter(this, void 0, void 0, function* () {
                            return yield JSZip.loadAsync(data, {});
                        });
                    }).then((data) => {
                        resolve(data);
                    }, (reason) => {
                        resolve(undefined);
                    });
                }
                catch (error) {
                    resolve(undefined);
                }
            });
        });
    }
    static fillParentObjects(alApps) {
        alApps.forEach(alApp => {
            var alObjects = alApp.alObjects.filter(alObject => alObject.isExtension());
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
    static searchALObjectByID(alApps, objectType, objectID) {
        alApps.forEach(alApp => {
            const alObject = alApp.alObjects.find(alObject => alObject.objectType === objectType && alObject.objectID === objectID);
            if (alObject) {
                return alObject;
            }
        });
        return undefined;
    }
    static searchALObjectByName(alApps, objectType, objectName) {
        alApps.forEach(alApp => {
            const alObject = alApp.alObjects.find(alObject => alObject.objectType === objectType && alObject.objectName === objectName);
            if (alObject) {
                return alObject;
            }
        });
        return undefined;
    }
    //#region Definition / Hover Provider
    static getCurrentALObjectByUri(document) {
        const uri = document.uri;
        const message = JSON.parse(uri.fragment);
        const alApp = internal_1.reader.alApps.find(alApp => alApp.appName === message.AppName);
        if (!alApp) {
            return undefined;
        }
        return alApp.alObjects.find(alObject => alObject.objectType === message.Type && alObject.objectID === message.ID);
    }
    static detectDefinitionName(line, characterPos) {
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
    static navigateToGlobalVariable(alObject, document, position, definitionName) {
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
    static navigateToFields(alObject, document, position, definitionName) {
        // Only tables and pages got fields at the moment
        if ([internal_1.ObjectType.Table, internal_1.ObjectType.TableExtension, internal_1.ObjectType.Page, internal_1.ObjectType.PageExtension].indexOf(alObject.objectType) === -1) {
            return undefined;
        }
        switch (alObject.objectType) {
            case internal_1.ObjectType.Table:
                return alObject.fields.find(alField => alField.fieldName === definitionName);
            case internal_1.ObjectType.TableExtension:
                return alObject.fields.find(alField => alField.fieldName === definitionName);
            case internal_1.ObjectType.Page:
                return alObject.fields.find(alField => alField.fieldName === definitionName);
            case internal_1.ObjectType.PageExtension:
                return alObject.fields.find(alField => alField.fieldName === definitionName);
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
    static navigateToNextLocalFunction(alObject, document, position, definitionName) {
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
    static navigateToLocalFunction(alObject, document, position, definitionName) {
        const alFunction = alObject.functions.find(alFunction => alFunction.functionName === definitionName);
        return alFunction;
    }
}
exports.HelperFunctions = HelperFunctions;
//# sourceMappingURL=HelperFunctions.js.map