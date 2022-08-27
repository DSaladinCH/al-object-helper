import * as vscode from "vscode";
import path = require("path");
import fs = require("fs-extra");
import lineReader = require("line-reader");
import { Readable } from 'stream';
import JSZip = require("jszip");
import { ALExtension, ALObject, extensionPrefix, HelperFunctions, ALApp, ALFunction, ALVariable, FunctionType, AppType, ObjectType, ALTable, ALTableField, ALPageField, ALPage, variablePattern, ALFunctionArgument, LicenseObject, LicenseInformation, LicensePurchasedObject } from "./internal";

export class Reader {
    extensionContext: vscode.ExtensionContext;
    outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel("AL Object Helper");
    workspaceConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration();
    alApps: ALApp[] = [];
    licenseInformation: LicenseInformation | undefined;
    printDebug: boolean = false;
    autoReloadObjects: boolean = false;
    onlyLoadSymbolFiles: boolean = false;
    onlyShowLocalFiles: boolean = false;

    private isReadingLocalApp: boolean = false;
    private isReadingApp: boolean = false;

    constructor(context: vscode.ExtensionContext) {
        this.extensionContext = context;
        this.loadConfiguration(this);

        if (vscode.workspace.workspaceFolders) {
            vscode.workspace.workspaceFolders.forEach((element) => {
                this.addLocalFolderAsApp(element.uri.fsPath);
                // var appPath = path.join(element.uri.fsPath, "app.json");
                // if (fs.existsSync(appPath)) {
                //     var json = fs.readJSONSync(appPath);
                //     this.alApps.push(new ALApp(AppType.local, json.name, json.publisher, json.version, json.runtime, element.uri.fsPath));
                // }
            });
        }

        vscode.workspace.onDidChangeConfiguration((e) => {
            // update configurations
            this.loadConfiguration(this);
        });
    }

    loadConfiguration(reader: Reader) {
        reader.workspaceConfig = vscode.workspace.getConfiguration();
        reader.printDebug = reader.workspaceConfig.get("alObjectHelper.printDebug") as boolean;
        reader.autoReloadObjects = !reader.workspaceConfig.get("alObjectHelper.suppressAutoReloadObjects") as boolean;
        reader.onlyLoadSymbolFiles = reader.workspaceConfig.get("alObjectHelper.onlyLoadSymbolFiles") as boolean;
        reader.onlyShowLocalFiles = reader.workspaceConfig.get("alObjectHelper.onlyShowLocalFiles") as boolean;
    }

    async startReading() {
        for (let index = 0; index < this.alApps.length; index++) {
            const alApp = this.alApps[index];
            await this.discoverAppPackagesOfLocalApp(alApp);
        }
        if (this.printDebug) { this.outputChannel.appendLine(`Found ${this.alApps.filter(alApp => alApp.appType === AppType.appPackage).length} app files in all projects`); }

        await Promise.all([
            this.startReadingLocalApps(this.alApps.filter(app => app.appType === AppType.local)),
            this.startReadingAppPackages(this.alApps.filter(app => app.appType === AppType.appPackage && app.appChanged))
        ]);
    }

    addLocalFolderAsApp(folderPath: string): ALApp | null {
        var appPath = path.join(folderPath, "app.json");
        if (fs.existsSync(appPath)) {
            var json = fs.readJSONSync(appPath);
            const alApp = new ALApp(AppType.local, json.name, json.publisher, json.version, json.runtime, folderPath, new Date());
            this.alApps.push(alApp);
            return alApp;
        }

        return null;
    }

    async startReadingLocalApps(alApps: ALApp[]) {
        if (this.isReadingLocalApp) {
            return;
        }
        this.isReadingLocalApp = true;

        if (this.printDebug) { this.outputChannel.appendLine("Start reading local apps!"); }
        let alFiles: string[] = [];

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Reading local objects - Current"
        }, async (progress, token) => {
            await new Promise((resolve) => {
                let reader = this;
                const start = async function () {
                    var start = Date.now();

                    var filteredALApps = alApps.filter(app => app.appType === AppType.local);
                    var quotient = Math.floor(100 / filteredALApps.length);
                    console.log(extensionPrefix + `Found ${filteredALApps.length} workspace folders`);
                    for (let i = 0; i < filteredALApps.length; i++) {
                        const alApp = filteredALApps[i];
                        alApp.clearALObjects();
                        await reader.discoverAppPackagesOfLocalApp(alApp);
                        progress.report({ message: `${alApp.appName} (0 of 0)`, increment: quotient });

                        console.log(extensionPrefix + `Found project "${alApp.appName}" with path "${alApp.appPath}"`);
                        if (reader.printDebug) { reader.outputChannel.appendLine(`Search al files in local project "${alApp.appName}"`); }

                        let files = await HelperFunctions.getFiles(alApp.appPath, 'al');
                        if (reader.printDebug) { reader.outputChannel.appendLine(`Found ${files.length} al files in local project "${alApp.appName}"`); }
                        alFiles = alFiles.concat(files);
                        await reader.getALSymbols(files, alApp, (a, m) => {
                            progress.report({ message: `${alApp.appName} (${a} of ${m})` });
                        });
                    }

                    // console.log(extensionPrefix + `Duration: ${(Date.now() - start)}`);
                    resolve('');
                };
                start();
            });
            HelperFunctions.fillParentObjects(this.alApps);

            console.log(extensionPrefix + `Found ${alFiles.length} AL Files in all local projects`);
            if (this.printDebug) { this.outputChannel.appendLine(`Found ${alFiles.length} al files in all local projects`); }
            let objectCount = 0;
            this.alApps.filter(app => app.appType === AppType.local).forEach(app => objectCount += app.alObjects.length);
            console.log(extensionPrefix + `Found ${objectCount} AL Objects in all local projects`);
            if (this.printDebug) {
                if (alFiles.length - objectCount > 0) {
                    this.outputChannel.appendLine(`Found ${objectCount} al objects, so ${alFiles.length - objectCount} objects could not be read or are not supported yet`);
                }
                else {
                    this.outputChannel.appendLine(`Found ${objectCount} al objects`);
                }
            }

            this.isReadingLocalApp = false;
            return true;
        });
    }

    async startReadingAppPackages(alApps: ALApp[]) {
        if (this.isReadingApp) {
            return;
        }
        this.isReadingApp = true;

        if (this.printDebug) { this.outputChannel.appendLine("Start reading app packages!"); }
        if (alApps.length === 0) {
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Reading app packages - Current"
        }, async (progress, token) => {
            await new Promise((resolve) => {
                let reader = this;
                const start = async function () {
                    var start = Date.now();

                    var filteredALApps = alApps.filter(app => app.appType === AppType.appPackage);
                    var quotient = Math.floor(100 / filteredALApps.length);
                    for (let i = 0; i < filteredALApps.length; i++) {
                        var alApp = filteredALApps[i];
                        alApp.clearALObjects();
                        progress.report({ message: `${alApp.appName} (0 of 0)`, increment: quotient });

                        // console.log(extensionPrefix + `Found app package "${alApp.appName}" with path "${alApp.appPath}"`);
                        console.log(extensionPrefix + `Found app package "${alApp.appName}"`);
                        if (reader.printDebug) { reader.outputChannel.appendLine(`Search al files in app package "${alApp.appName}"`); }

                        await reader.getAppALSymbols(alApp, (a, m) => {
                            progress.report({ message: `${alApp.appName} (${a} of ${m})` });
                        });
                        alApp.appChanged = false;
                    }

                    // console.log(extensionPrefix + `Duration: ${(Date.now() - start)}`);
                    HelperFunctions.fillParentObjects(reader.alApps);
                    resolve('');
                };
                start();
            });

            this.isReadingApp = false;
            return true;
        });
    }

    getLstat(filePath: string): Promise<fs.Stats> {
        return new Promise<fs.Stats>(async (resolve) => {
            await fs.lstat(filePath, function (error, stats) {
                resolve(stats);
            });
        });
    }

    /**
     * Get all al objects out of real al files
     * @param alFiles Paths of al files
     * @param alApp The app file which these al files belong to
     * @returns 
     */
    getALSymbols(alFiles: string[], alApp: ALApp, updateCallback?: (alreadyDone: number, maxNumber: number) => void): Promise<void> {
        return new Promise<void>(async (resolve) => {

            let alreadyDoneCounter = 0;
            let maxLength = alFiles.length;
            let length = Math.ceil(alFiles.length / 2);

            var update = (): void => {
                alreadyDoneCounter++;
                if (updateCallback) {
                    updateCallback(alreadyDoneCounter, maxLength);
                }
            };

            let promise1 = this.getAlSymbolsRange(alFiles.splice(0, length), alApp, () => { update(); });
            let promise2 = this.getAlSymbolsRange(alFiles, alApp, () => { update(); });
            let alObjects: ALObject[] = [];
            await Promise.all([promise1, promise2]).then((results: ALObject[][]) => {
                results.forEach(element => {
                    alObjects = alObjects.concat(element);
                });
            });

            alApp.addObjects(alObjects);
            resolve();
        });
    }

    getAlSymbolsRange(alFiles: string[], alApp: ALApp, updateCallback?: () => void): Promise<ALObject[]> {
        return new Promise<ALObject[]>(async (resolve) => {
            let reader = this;
            let alObjects: ALObject[] = [];
            for (let i = 0; i < alFiles.length; i++) {
                if (updateCallback) { updateCallback(); }

                let alObject = await reader.searchObjectInContent(alFiles[i], alApp);
                if (alObject) {
                    alObjects.push(alObject);
                }
            }
            resolve(alObjects);
        });
    }

    /**
     * Get all al objects out of a app file
     * @param alApp The app file which should be read
     * @returns 
     */
    getAppALSymbols(alApp: ALApp, updateCallback?: (alreadyDone: number, maxNumber: number) => void): Promise<void> {
        return new Promise<void>(async (resolve) => {
            let reader = this;

            const jsZip = await HelperFunctions.readZip(alApp.appPath);
            if (!jsZip) {
                resolve();
                return;
            }

            const alFiles = Object.keys(jsZip.files).filter(file => file.endsWith(".al"));
            if (alFiles.length === 0) {
                resolve();
                return;
            }

            let startDate = Date.now();

            let alObjects: ALObject[] = [];

            let alreadyDoneCounter = 0;
            let maxLength = alFiles.length;
            let length = Math.ceil(alFiles.length / 2);

            var update = (): void => {
                alreadyDoneCounter++;
                if (updateCallback) {
                    updateCallback(alreadyDoneCounter, maxLength);
                }
            };

            let promise1 = this.getAppAlSymbolsRange(jsZip, alFiles.splice(0, length), alApp, () => { update(); });
            let promise2 = this.getAppAlSymbolsRange(jsZip, alFiles, alApp, () => { update(); });
            await Promise.all([promise1, promise2]).then((results: ALObject[][]) => {
                results.forEach(element => {
                    alObjects = alObjects.concat(element);
                });
            });

            // console.log(extensionPrefix + "Time: " + (Date.now() - startDate));
            alApp.addObjects(alObjects);
            resolve();
        });
    }

    getAppAlSymbolsRange(jsZip: JSZip, alFiles: string[], alApp: ALApp, updateCallback?: () => void): Promise<ALObject[]> {
        return new Promise<ALObject[]>(async (resolve) => {
            let reader = this;
            let alObjects: ALObject[] = [];
            for await (const alFile of alFiles) {
                if (updateCallback) { updateCallback(); }

                const contentBuffer: Buffer | undefined = await jsZip.file(alFile)?.async("nodebuffer");
                if (!contentBuffer) {
                    continue;
                }

                const readable = Readable.from(contentBuffer);
                let alObject = await reader.searchObjectInContent(alFile, alApp, readable);
                if (alObject) {
                    alObjects.push(alObject);
                }
            }
            resolve(alObjects);
        });
    }

    searchObjectInContent(filePath: string, alApp: ALApp, readable?: Readable): Promise<ALObject | undefined> {
        return new Promise<ALObject | undefined>(async (resolve) => {
            let reader = this;
            let alObject: ALObject;
            try {
                let file: string | NodeJS.ReadableStream = filePath;
                if (readable) {
                    file = readable;
                }

                let lineNo = -1;
                let firstLine = true;
                let currentFunction: ALFunction | undefined;
                let nextFunctionType: FunctionType | undefined;
                let nextFunctionArgument: ALFunctionArgument | undefined;
                let collectionVariables: boolean = false;

                lineReader.eachLine(file, function (line, isLast, cb = async () => {
                    // Callback
                    if (firstLine) {
                        resolve(undefined);
                        return;
                    }
                    resolve(alObject);
                    return;
                }) {
                    if (isLast) {
                        cb(false);
                        return false;
                    }

                    // each line
                    lineNo++;
                    if (firstLine) {
                        const tempALObject = reader.readFirstObjectLine(line, filePath, alApp);
                        if (!tempALObject) {
                            if (isLast) {
                                cb(false);
                                return false;
                            }
                            return true;
                        }

                        alObject = tempALObject;
                        firstLine = false;
                        alObject.addLocalEvents();
                        // Finish searching because of user preferences
                        if (reader.onlyLoadSymbolFiles) {
                            cb(false);
                            return false;
                        }
                        return true;
                    }

                    if (alObject.objectType === ObjectType.Table || alObject.objectType === ObjectType.TableExtension) {
                        if (/^\s*field\(/i.test(line)) {
                            currentFunction = undefined;
                            collectionVariables = false;

                            // is a table field
                            var tableFieldPattern = /field\(([0-9]+)\;\s?(\"[^\"]+\"|[a-z0-9\_]+)\;\s?([a-z0-9\[\]]+|Enum (\"[^\"]+\"|[a-z0-9\_]+))\)/i;
                            const match = tableFieldPattern.exec(line);
                            if (!match) { return true; }

                            const fieldID = match[1];
                            const fieldName = match[2];
                            const fieldType = match[3];
                            const alTableField = new ALTableField(fieldID, fieldName, fieldType, lineNo);
                            ALTableField.addToObject(alObject, alTableField);
                            ALTableField.addValidateEvent(alObject, alTableField);

                            return true;
                        }
                    }
                    else if (alObject.objectType === ObjectType.Page || alObject.objectType === ObjectType.PageExtension) {
                        if (alObject.objectType === ObjectType.Page && (alObject as ALPage).sourceTable === undefined) {
                            var pageSourceTablePattern = /(?:SourceTable)\s?\=\s?([a-z0-9\_]+|\"[^\"]+\")\;/i;
                            const match = pageSourceTablePattern.exec(line);
                            if (match) {
                                (alObject as ALPage).sourceTable = new ALTable("", "", match[1], ALApp.Empty());
                                return true;
                            }
                        }

                        if (/^\s*field\(/i.test(line)) {
                            currentFunction = undefined;
                            collectionVariables = false;

                            // is a page field
                            var pageFieldPattern = /field\((\"[^\"]+\"|[a-z0-9\_]+)\;\s?(\"[^\"]+\"|[a-z0-9\_]+)\)/i;
                            const match = pageFieldPattern.exec(line);
                            if (!match) { return true; }

                            const fieldID = match[1];
                            const fieldName = match[2];
                            const alPageField = new ALPageField(fieldID, fieldName, lineNo);
                            ALPageField.addToObject(alObject, alPageField);
                            ALPageField.addValidateEvent(alObject, alPageField);

                            return true;
                        }
                    }

                    // currently in a function
                    if (currentFunction) {
                        // first check if the function code starts now
                        if (/begin$/i.test(line)) {
                            // function code begins now, so skip this part
                            currentFunction = undefined;
                            collectionVariables = false;

                            return true;
                        }

                        if (/var$/i.test(line)) {
                            // function variables are listed now, so skip this line and collect all variables
                            collectionVariables = true;

                            return true;
                        }

                        if (collectionVariables) {
                            //var variablePattern = /\s(\"[^\"\r\n\t]+\"|[a-z0-9\_]+)\s?\:\s([a-z\[\]0-9]+)\s?(\'[^\'\;]+\'|\"[^\"\;]+\"|of [^\"\;]+|[^\"\s\;]+|)( temporary)?\;/i;
                            const match = variablePattern.exec(line);
                            if (!match) { return true; }

                            let isTemporary = false;
                            if (match[4]) {
                                isTemporary = true;
                            }
                            else if (match[3].endsWith(" temporary")) {
                                isTemporary = true;
                            }
                            currentFunction.variables.push(new ALVariable(match[1], match[2], match[3], lineNo, { isTemporary: isTemporary, isVar: false }));

                            return true;
                        }
                    }
                    // search for new function
                    else {
                        if (/var$/i.test(line)) {
                            // global variables are listed now, so skip this line and collect all variables
                            collectionVariables = true;

                            return true;
                        }

                        currentFunction = reader.getProcedure(line, lineNo, alObject, nextFunctionType, nextFunctionArgument);
                        if (currentFunction) {
                            collectionVariables = false;
                        }
                        nextFunctionArgument = undefined;
                        nextFunctionType = reader.checkEventPublisher(line);

                        // if event subscriber, get informations of the subscriber
                        if (nextFunctionType === FunctionType.EventSubscriber) {
                            nextFunctionArgument = reader.getEventSubscriber(line);
                        }

                        // check for a global variable after checking for a new function
                        if (collectionVariables) {
                            const match = variablePattern.exec(line);
                            if (!match) { return true; }

                            let isTemporary = false;
                            if (match[4]) {
                                isTemporary = true;
                            }
                            else if (match[3].endsWith(" temporary")) {
                                isTemporary = true;
                            }
                            alObject.variables.push(new ALVariable(match[1], match[2], match[3], lineNo, { isTemporary: isTemporary, isVar: false }));

                            return true;
                        }

                        return true;
                    }
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.log(extensionPrefix + error.message);
                }
                resolve(undefined);
            }
        });
    }

    readFirstObjectLine(lineText: string, filePath: string, alApp: ALApp): ALObject | undefined {
        const alObjectPattern = /^([a-z]+)\s([0-9]+)\s([a-z0-9\_]+|\"[^\"]+\")(\sextends\s([a-z0-9\_]+|\"[^\"]+\")|[\s\{]?|)[\s\{]?/i;
        const alObjectNonIDPattern = /^([^\s]+)(?: ([a-z0-9\_]+|\"[^\"]+\")|$)$/i;

        let matches = alObjectPattern.exec(lineText);
        if (matches === null) {
            matches = alObjectNonIDPattern.exec(lineText);
            if (matches !== null) {
                let typeStr = matches[1];
                let name = "Type " + ObjectType[HelperFunctions.getObjectTypeFromString(typeStr)];
                if (matches[2] !== undefined) {
                    name = HelperFunctions.removeNameSurrounding(matches[2]);
                }
                matches.splice(0);
                matches.push(lineText);
                matches.push(typeStr);
                matches.push("");
                matches.push(name);
                matches.push("");
                matches.push("");
            }
            else {
                return undefined;
            }
        }
        if (matches.length < 6) {
            return undefined;
        }

        let alObject: ALObject | undefined;
        const typeStr = matches[1].trim().toLowerCase();
        const type = HelperFunctions.getObjectTypeFromString(typeStr);
        if (type === ObjectType.NotAvailable) {
            return undefined;
        }
        const id = matches[2].trim();
        const name = HelperFunctions.removeNameSurrounding(matches[3].trim());

        alObject = ALObject.createByObjectType(type, filePath, id, name, alApp);
        if (!alObject) {
            return undefined;
        }

        // if group 5 is empty, it is not a extension object
        if (matches[5] === undefined || matches[5] === "") {

        }
        // if group 4 is not empty, it is a extension object
        else {
            const extendsName = HelperFunctions.removeNameSurrounding(matches[5].trim());
            (alObject as ALExtension).setTempParentObjectFromType(extendsName);
        }

        return alObject;
    }

    replaceObjectID(line: string, newObjectID: string): string {
        const alObjectStartPattern = /^([a-z]+)/i;
        const alObjectIDPattern = /^[a-z]+\s([0-9]+)/i;
        var newLine = line.replace(alObjectIDPattern, newObjectID);
        var matches = alObjectStartPattern.exec(line);
        if (!matches) {
            return "";
        }

        return `${matches[1]} ${newLine}`;
    }

    checkEventPublisher(lineText: string): FunctionType | undefined {
        const eventPattern = /\[([A-z]+)[^\]]*\]/i;
        let match = eventPattern.exec(lineText);

        if (!match) {
            return (undefined);
        }

        return ALFunction.getFunctionTypeByString(match[1]);
    }

    getEventSubscriber(lineText: string): ALFunctionArgument | undefined {
        const eventSubscriberPattern = /\[EventSubscriber\(ObjectType::([^,]+),\s?[^:]+::("[^"]+"|[^,]+),\s?'([^']*)',\s?'([^']*)'/i;
        let match = eventSubscriberPattern.exec(lineText);

        if (!match) {
            return (undefined);
        }

        return ALFunctionArgument.createEventSubscriber(match[1], match[2], match[3], match[4]);
    }

    getProcedure(lineText: string, lineNo: number, alObject: ALObject, customFunctionType?: FunctionType, functionArgument?: ALFunctionArgument): ALFunction | undefined {
        try {
            const procedurePattern = /(local)?\s?(procedure|trigger) ([^(]*)\(([^)]*)?\)(?::\s?([^\s]+))?/i;
            let match = procedurePattern.exec(lineText);
            if (!match) {
                return undefined;
            }

            let functionType = ALFunction.getFunctionTypeByString(match[2]);
            if (functionType === undefined) {
                return undefined;
            }
            const isLocal = match[1] !== undefined;
            const name = match[3];
            let parameters: ALVariable[] = [];
            if (match[4] !== undefined) {
                parameters = ALFunction.convertParametersText(match[4], lineNo);
            }
            let returnValue: ALVariable | undefined = undefined;
            if (match[5] !== undefined) {
                const returnValuePattern = /\s?([^\s|;]+)( \"?([^"|\n|;]+)\"?)?/i;
                let match2 = returnValuePattern.exec(match[5]);
                if (match2) {
                    returnValue = new ALVariable("", match2[1], match2[2], lineNo, { isTemporary: false, isVar: false });
                }
            }

            if (customFunctionType) {
                functionType = customFunctionType;
            }
            const alFunction = new ALFunction(functionType, name, { lineNo: lineNo, parameters: parameters, returnValue: returnValue, isLocal: isLocal });
            alFunction.functionArgument = functionArgument;
            alObject.functions.push(alFunction);
            return alFunction;
        }
        catch (error) {
            return undefined;
        }
    }

    discoverAppPackagesOfLocalApp(alApp: ALApp): Promise<void> {
        return new Promise<void>(async (resolve) => {
            if (alApp.appType !== AppType.local) {
                resolve();
                return;
            }
            if (this.printDebug) { this.outputChannel.appendLine(`Now search all app files in path ${alApp.appPath}`); }
            let appFiles = await HelperFunctions.getFiles(alApp.appPath + '.alpackages', 'app');
            if (this.printDebug) { this.outputChannel.appendLine(`Found ${appFiles.length} app files in path ${alApp.appPath}`); }
            for await (const appPath of appFiles) {
                if (this.printDebug) {
                    this.outputChannel.appendLine("");
                    this.outputChannel.appendLine(`Now reading app file ${appPath}`);
                }
                const jsZip = await HelperFunctions.readZip(appPath);
                if (!jsZip) {
                    if (this.printDebug) { this.outputChannel.appendLine(`Stop reading app file ${appPath} because of an error or a non existing app file`); }
                    continue;
                }

                if (this.printDebug) { this.outputChannel.appendLine(`Now extracting NavxManifest.xml from app file ${appPath}`); }
                const manifest = Object.keys(jsZip.files).find(fileName => fileName.endsWith("NavxManifest.xml"));
                if (!manifest) {
                    continue;
                }

                if (this.printDebug) { this.outputChannel.appendLine(`Creating buffer of NavxManifest.xml from app file ${appPath}`); }
                const contentBuffer: Buffer | undefined = await jsZip.file(manifest)?.async("nodebuffer");
                if (!contentBuffer) {
                    continue;
                }
                const content = contentBuffer.toString();
                const manifestAppPattern = /<App.+Name="([^"]+)".+Publisher="([^"]+)".+Version="([^"]+)".+Runtime="([^"]+)"/i;
                if (this.printDebug) { this.outputChannel.appendLine(`Extracting data of NavxManifest.xml from app file ${appPath}`); }
                const matches = manifestAppPattern.exec(content);
                if (!matches) {
                    continue;
                }

                const appDate = await HelperFunctions.getFileModifyDate(appPath);
                if (this.printDebug) { this.outputChannel.appendLine(`Adding app file ${appPath} to array`); }
                if (!this.alApps.find(app => app.appName === matches[1] && app.appPublisher === matches[2])) {
                    this.alApps.push(new ALApp(AppType.appPackage, matches[1], matches[2], matches[3], matches[4], appPath, appDate));
                }
                else {
                    var existingALApp = this.alApps.find(app => app.appName === matches[1] && app.appPublisher === matches[2]);
                    if (existingALApp && existingALApp.appType === AppType.appPackage) {
                        // app did not change by default
                        existingALApp.appChanged = false;
                        // if the date is not the same as the saved date, then the app changed
                        if (existingALApp.appDate.getTime() !== appDate.getTime()) {
                            existingALApp.appDate = appDate;
                            existingALApp.appChanged = true;
                        }
                    }
                }
            }

            const appPackages = this.alApps.filter(alApp => alApp.appType === AppType.appPackage);
            for (let i = 0; i < appPackages.length; i++) {
                if (!await HelperFunctions.pathExists(appPackages[i].appPath)) {
                    console.log(extensionPrefix + `Did not find apppackage ${appPackages[i].appName}, so it gets deleted`);
                    this.alApps.splice(this.alApps.findIndex(alApp => alApp.appPath === appPackages[i].appPath));
                }
            }

            if (this.printDebug) {
                this.outputChannel.appendLine("");
                this.outputChannel.appendLine(`Found all app files in ${alApp.appPath}`);
            }
            resolve();
        });
    }

    loadLicense(licenseFilePath: vscode.Uri): Promise<void> {
        return new Promise<void>((resolve) => {
            var customerName: string, productVersion: string, expiryDate: string;
            var licenseObjects: LicenseObject[] = [];
            var licensePurchasedObjects: LicensePurchasedObject[] = [];
            const purchaseObjectsInformationPattern: RegExp = /(Purchased|Assigned) ([a-z]+)[^:]+: ([0-9]+)/i;
            const licenseInformationPattern: RegExp = /^([^:]+):([^\r\n]+)$/i;
            const objectAssignmentPattern: RegExp = /^(.{30,60})(.{15})(.{15})(.{15,20})([RIMDX-]{5})/i;
            const unsupportedCharacterPattern: RegExp = /\uFFFD/g;
            var purchaseObjectsInformation: Boolean;
            var licenseInformation: Boolean;
            var objectAssignment: Boolean;
            var moduleObjects: Boolean;
            var reader = this;

            lineReader.eachLine(licenseFilePath.fsPath, function (line, isLast, cb = async () => {
                // Callback
                reader.licenseInformation = new LicenseInformation(customerName, productVersion, expiryDate);
                reader.licenseInformation.licenseObjects = licenseObjects;
                reader.licenseInformation.purchasedObjects = licensePurchasedObjects;
                resolve();
                return;
            }) {
                if (isLast) {
                    cb(false);
                    return false;
                }

                switch (line) {
                    case "Custom Area Objects":
                        purchaseObjectsInformation = true;
                        licenseInformation = false;
                        objectAssignment = false;
                        moduleObjects = false;
                        break;
                    case "License and Address Information":
                        purchaseObjectsInformation = false;
                        licenseInformation = true;
                        objectAssignment = false;
                        moduleObjects = false;
                        break;
                    case "Object Assignment":
                        purchaseObjectsInformation = false;
                        licenseInformation = false;
                        objectAssignment = true;
                        moduleObjects = false;
                        break;
                    case "Module Objects and Permissions":
                        purchaseObjectsInformation = false;
                        licenseInformation = false;
                        objectAssignment = false;
                        moduleObjects = true;
                        break;
                    case "Limited Usage Ranges":
                        purchaseObjectsInformation = false;
                        licenseInformation = false;
                        objectAssignment = false;
                        moduleObjects = false;

                        cb(false);
                        return false;
                }

                var objectTypeStr: string, rangeFrom: string, rangeTo: string, rimdx: string, moduleName: string;
                var objectType: ObjectType | undefined;

                if (purchaseObjectsInformation) {
                    const match = purchaseObjectsInformationPattern.exec(line);
                    if (!match) { return true; }

                    const areaType = match[1].replace(unsupportedCharacterPattern, '').trim();
                    objectTypeStr = match[2].replace(unsupportedCharacterPattern, '').trim();
                    const areaCountStr = match[3].replace(unsupportedCharacterPattern, '').trim();
                    objectType = LicenseObject.getObjectType(objectTypeStr);
                    if (objectType === undefined) { return true; }

                    if (areaType.toLowerCase() === "purchased") {
                        licensePurchasedObjects.push(new LicensePurchasedObject(objectType, Number.parseInt(areaCountStr)));
                    }
                    // assigned
                    else {
                        var purchasedObject = licensePurchasedObjects.find(purchasedObject => purchasedObject.objectType === objectType);
                        if (purchasedObject) {
                            purchasedObject.noAssigned = Number.parseInt(areaCountStr);
                        }
                    }
                }
                else if (licenseInformation) {
                    const match = licenseInformationPattern.exec(line);
                    if (!match) { return true; }

                    switch (match[1].replace(unsupportedCharacterPattern, '').trim()) {
                        case "Name": {
                            customerName = match[2].replace(unsupportedCharacterPattern, '').trim();
                        }
                        case "Product Version": {
                            productVersion = match[2].replace(unsupportedCharacterPattern, '').trim();
                        }
                        case "Enhancement Expiry Date": {
                            expiryDate = match[2].replace(unsupportedCharacterPattern, '').trim();
                        }
                    }
                }
                else if (objectAssignment && line.length === 80) {
                    const match = objectAssignmentPattern.exec(line);
                    if (!match) { return true; }

                    objectTypeStr = match[1].replace(unsupportedCharacterPattern, '').trim();
                    rangeFrom = match[3].replace(unsupportedCharacterPattern, '').trim();
                    rangeTo = match[4].replace(unsupportedCharacterPattern, '').trim();
                    rimdx = match[5].replace(unsupportedCharacterPattern, '').trim();
                    objectType = LicenseObject.getObjectType(objectTypeStr);
                    if (objectType === undefined) { return true; }

                    licenseObjects.push(new LicenseObject(objectType, rangeFrom, rangeTo, rimdx));
                }
                else if (moduleObjects && line.length === 115) {
                    const match = objectAssignmentPattern.exec(line);
                    if (!match) { return true; }

                    objectTypeStr = match[4].replace(unsupportedCharacterPattern, '').trim();
                    moduleName = match[1].replace(unsupportedCharacterPattern, '').trim();
                    rangeFrom = match[2].replace(unsupportedCharacterPattern, '').trim();
                    rangeTo = match[3].replace(unsupportedCharacterPattern, '').trim();
                    rimdx = match[5].replace(unsupportedCharacterPattern, '').trim();
                    objectType = LicenseObject.getObjectType(objectTypeStr);
                    if (objectType === undefined) { return true; }

                    if (moduleName === "Essentials Objects (hidden)") {
                        // No more important license data to import
                        cb(false);
                        return false;
                    }
                    licenseObjects.push(new LicenseObject(objectType, rangeFrom, rangeTo, rimdx, moduleName));
                }

                return true;
            });
        });
    }

    checkLicense(showOuput: Boolean): Promise<ALObject[]> {
        return new Promise<ALObject[]>(async (resolve) => {
            var reader = this;
            var alObjectsOutOfRange: ALObject[] = [];

            if (!reader.licenseInformation) {
                resolve(alObjectsOutOfRange);
                return alObjectsOutOfRange;
            }

            this.alApps.filter(a => a.appType === AppType.local).forEach((app) => {
                app.alObjects.forEach((alObject) => {
                    if (!LicenseObject.isLicenseImportant(alObject.objectType)) { return; }

                    var outOfRange = true;
                    reader.licenseInformation?.licenseObjects.filter(l => l.objectType === alObject.objectType).forEach((licenseObject) => {
                        if (alObject.objectID >= licenseObject.rangeFrom && alObject.objectID <= licenseObject.rangeTo) {
                            outOfRange = false;
                        }
                    });

                    if (outOfRange) {
                        alObjectsOutOfRange.push(alObject);
                    }
                });
            });

            reader.licenseInformation?.purchasedObjects.forEach(purchasedObject => {
                var noOfObjects: number = 0;
                reader.alApps.filter(alApp => alApp.appType === AppType.local).forEach(alApp => {
                    noOfObjects += alApp.alObjects.filter(alObject => alObject.objectType === purchasedObject.objectType).length;
                });

                purchasedObject.noOfObjects = noOfObjects;
                purchasedObject.noNotInRange = alObjectsOutOfRange.filter(alObject => alObject.objectType === purchasedObject.objectType).length;
            });

            alObjectsOutOfRange = alObjectsOutOfRange.sort((a, b) => a.objectID.localeCompare(b.objectID));
            if (showOuput) {
                if (alObjectsOutOfRange.length === 0) {
                    vscode.window.showInformationMessage("All objects are in range of the license file");
                    resolve(alObjectsOutOfRange);
                    return;
                }

                const separator = "-----------------------------------------------------------------------------------\r\n";
                var outputText = "";
                outputText += separator;
                outputText += "Not all objects are in range. Objects out of range:\r\n";
                outputText += separator + "\r\n";
                alObjectsOutOfRange.forEach(alObject => {
                    outputText += `${ObjectType[alObject.objectType]} ${alObject.objectID} - ${alObject.objectName}\r\n`;
                });
                outputText += "\r\n" + separator;
                outputText += `Total: ${alObjectsOutOfRange.length} objects`;
                var textDocument = await vscode.workspace.openTextDocument({ content: outputText });
                await vscode.window.showTextDocument(textDocument, vscode.ViewColumn.Active);
            }

            resolve(alObjectsOutOfRange);
        });
    }

    getFreeObjects(): Promise<ALObject[]> {
        return new Promise<ALObject[]>((resolve => {
            var reader = this;
            var freeObjects: ALObject[] = [];

            if (!reader.licenseInformation) {
                resolve(freeObjects);
                return freeObjects;
            }

            var localObjects: ALObject[] = [];
            reader.alApps.filter(app => app.appType === AppType.local).forEach((alApp) => {
                localObjects = localObjects.concat(alApp.alObjects);
            });

            reader.licenseInformation.licenseObjects.filter(licenseObject => !licenseObject.moduleName).forEach((licenseObject) => {
                for (let i = parseInt(licenseObject.rangeFrom); i <= parseInt(licenseObject.rangeTo); i++) {
                    const alObject = localObjects.find(alObject => alObject.objectType === licenseObject.objectType && parseInt(alObject.objectID) === i);
                    if (alObject === undefined) {
                        const tempFreeObject = ALObject.createByObjectType(licenseObject.objectType, "", i.toString(), "", ALApp.Empty());
                        if (tempFreeObject) {
                            freeObjects.push(tempFreeObject);
                        }
                    }
                }
            });

            reader.licenseInformation.purchasedObjects.forEach(purchasedObject => {
                purchasedObject.noOfFreeObjects = freeObjects.filter(alObject => alObject.objectType === purchasedObject.objectType).length;
            });

            resolve(freeObjects);
            return freeObjects;
        }));
    }

    updateSetting(name: string, value: string) {
        const target = vscode.ConfigurationTarget.Global;
        this.workspaceConfig.update(name, value, target);
    }
}