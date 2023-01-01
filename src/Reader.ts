import * as vscode from "vscode";
import path = require("path");
import fs = require("fs-extra");
import lineReader = require("line-reader");
import { Readable } from 'stream';
import JSZip = require("jszip");
import { ALExtension, ALObject, extensionPrefix, HelperFunctions, ALApp, ALFunction, ALVariable, FunctionType, AppType, ObjectType, ALTable, ALTableField, ALPageField, ALPage, variablePattern, ALFunctionArgument, LicenseObject, LicenseInformation, LicensePurchasedObject, Mode, ALCodeunit, ALEnum, ALEnumField } from "./internal";
import { compareVersions } from 'compare-versions';

export class Reader {
    extensionContext: vscode.ExtensionContext;
    outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel("AL Object Helper");
    workspaceConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration();
    alApps: ALApp[] = [];
    licenseInformation: LicenseInformation | undefined;
    printDebug: boolean = false;
    autoReloadObjects: boolean = false;
    mode: Mode = Mode.Performance;
    onlyShowLocalFiles: boolean = false;
    alPackageCachePath: string = "";
    alApplicationVersion: string = "";

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

    private loadConfiguration(reader: Reader) {
        reader.workspaceConfig = vscode.workspace.getConfiguration();
        reader.printDebug = reader.workspaceConfig.get("alObjectHelper.printDebug") as boolean;
        reader.autoReloadObjects = !reader.workspaceConfig.get("alObjectHelper.suppressAutoReloadObjects") as boolean;
        reader.mode = Mode[(reader.workspaceConfig.get("alObjectHelper.mode") as string).replace(/\s/g, '') as keyof typeof Mode];
        reader.onlyShowLocalFiles = reader.workspaceConfig.get("alObjectHelper.onlyShowLocalFiles") as boolean;

        reader.alPackageCachePath = reader.workspaceConfig.get("al.packageCachePath") as string;
    }

    /**
     * Starts the complete reading of all apps and .al files
     */
    async start() {
        if (!path.isAbsolute(this.alPackageCachePath)) {
            for (let index = 0; index < this.alApps.filter(app => app.appType === AppType.local).length; index++) {
                const alApp = this.alApps.filter(app => app.appType === AppType.local)[index];
                await this.searchAppPackages(alApp.appRootPath);
            }
        }
        else {
            await this.searchAppPackages(this.alPackageCachePath);
        }

        if (this.printDebug) { this.outputChannel.appendLine(`Found ${this.alApps.filter(alApp => alApp.appType === AppType.appPackage).length} app files in all projects`); }

        await Promise.all([
            this.readLocalApps(this.alApps.filter(app => app.appType === AppType.local)),
            this.readAppPackages(this.alApps.filter(app => app.appType === AppType.appPackage && app.appChanged))
        ]);
    }

    addLocalFolderAsApp(folderPath: string): ALApp | null {
        var appPath = path.join(folderPath, "app.json");
        if (fs.existsSync(appPath)) {
            var json = fs.readJSONSync(appPath);

            let showMyCode = false;
            if (json.showMyCode !== undefined) {
                showMyCode = JSON.parse(json.showMyCode);
            }
            else if (json.resourceExposurePolicy.includeSourceInSymbolFile !== undefined) {
                showMyCode = JSON.parse(json.resourceExposurePolicy.includeSourceInSymbolFile);
            }

            var supportedVersion = json.application;
            if (supportedVersion === undefined)
                supportedVersion = json.platform;

            this.alApplicationVersion = supportedVersion;

            const alApp = new ALApp(AppType.local, json.id, json.name, json.publisher, json.version, supportedVersion, json.runtime, folderPath, new Date(), showMyCode);
            this.alApps.push(alApp);
            return alApp;
        }

        return null;
    }

    async readLocalApps(alApps: ALApp[], mode?: Mode) {
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
                        // await reader.searchAppPackages(alApp.appRootPath);
                        progress.report({ message: `${alApp.appName} (0 of 0)`, increment: quotient });

                        console.log(extensionPrefix + `Found project "${alApp.appName}" with path "${alApp.appRootPath}"`);
                        if (reader.printDebug) { reader.outputChannel.appendLine(`Search al files in local project "${alApp.appName}"`); }

                        let files = await HelperFunctions.getFiles(alApp.appRootPath, 'al');
                        if (reader.printDebug) { reader.outputChannel.appendLine(`Found ${files.length} al files in local project "${alApp.appName}"`); }
                        alFiles = alFiles.concat(files);

                        await reader.getAlFiles(files, alApp, mode, (a, m) => {
                            progress.report({ message: `${alApp.appName} (${a} of ${m})` });
                        });
                    }

                    // console.log(extensionPrefix + `Duration: ${(Date.now() - start)}`);
                    resolve('');
                };
                start();
            });
            HelperFunctions.fillMissingObjectNames(this.alApps);

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

    private searchAppPackages(searchPath: string): Promise<void> {
        return new Promise<void>(async (resolve) => {
            if (this.printDebug) { this.outputChannel.appendLine(`Now search all app files in path ${searchPath}`); }

            if (!searchPath.endsWith(".alpackages"))
                searchPath = path.join(searchPath, ".alpackages");

            let appFiles = await HelperFunctions.getFiles(searchPath, 'app');
            if (this.printDebug) { this.outputChannel.appendLine(`Found ${appFiles.length} app files in path ${searchPath}`); }

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
                if (!manifest)
                    continue;

                if (this.printDebug) { this.outputChannel.appendLine(`Creating buffer of NavxManifest.xml from app file ${appPath}`); }

                const contentBuffer: Buffer | undefined = await jsZip.file(manifest)?.async("nodebuffer");
                if (!contentBuffer)
                    continue;

                const content = contentBuffer.toString();
                const manifestAppPattern = /<App.+Id="([^"]+)".+Name="([^"]+)".+Publisher="([^"]+)".+Version="([^"]+)".+Application="([^"]+).+Runtime="([^"]+)".+ShowMyCode="([^"]+)"/i;
                const manifestAppPattern2 = /<App.+Id="([^"]+)".+Name="([^"]+)".+Publisher="([^"]+)".+Version="([^"]+)".+Platform="([^"]+).+Runtime="([^"]+)".+ShowMyCode="([^"]+)"/i;
                const manifestREPPattern = /<ResourceExposurePolicy.+IncludeSourceInSymbolFile="([^"]+)"/i;

                if (this.printDebug) { this.outputChannel.appendLine(`Extracting data of NavxManifest.xml from app file ${appPath}`); }

                var appMatches = manifestAppPattern.exec(content);
                const repMatches = manifestREPPattern.exec(content);
                if (!appMatches) {
                    appMatches = manifestAppPattern2.exec(content);
                    if (!appMatches)
                        continue;
                }

                let showMyCode: boolean = JSON.parse(appMatches[7].toLowerCase());
                if (repMatches)
                    showMyCode = JSON.parse(repMatches[1].toLowerCase());

                const appDate = await HelperFunctions.getFileModifyDate(appPath);
                if (this.printDebug) { this.outputChannel.appendLine(`Adding app file ${appPath} to array`); }

                const appId = appMatches[1];
                const appVersion = appMatches[4];
                const appSupportedVersion = appMatches[5];

                if (!this.alApps.find(app => app.appId === appId && app.appVersion === appVersion))
                    this.alApps.push(new ALApp(AppType.appPackage, appMatches[1], appMatches[2], appMatches[3], appMatches[4], appMatches[5], appMatches[6], appPath, appDate, showMyCode));
            }

            const appPackages = this.alApps.filter(alApp => alApp.appType === AppType.appPackage);
            for (let i = 0; i < appPackages.length; i++) {
                if (!await HelperFunctions.pathExists(appPackages[i].appRootPath)) {
                    console.log(extensionPrefix + `Did not find apppackage ${appPackages[i].appName}, so it gets deleted`);
                    this.alApps.splice(this.alApps.findIndex(alApp => alApp.appRootPath === appPackages[i].appRootPath));
                }
            }

            if (this.printDebug) {
                this.outputChannel.appendLine("");
                this.outputChannel.appendLine(`Found all app files in ${searchPath}`);
            }

            if (this.alApps.filter(app => app.appType === AppType.appPackage).length > 0) {
                var groups = this.groupAppPackagesById();

                const applicationMajor = +this.alApplicationVersion.split('.')[0];
                groups.forEach((alApps: ALApp[], appId: string) => {
                    alApps = alApps.sort((a, b) => compareVersions(a.appSupportedVersion, b.appSupportedVersion));

                    var hasCorrectMajorPackage: boolean = false;
                    var alAppToUse: ALApp;
                    alApps.forEach(alApp => {
                        if (compareVersions(alApp.appSupportedVersion, this.alApplicationVersion) < 0) {
                            this.alApps.splice(this.alApps.indexOf(alApp), 1);
                            return;
                        }

                        const appSupportedVersionMajor = +alApp.appSupportedVersion.split('.')[0];
                        if (appSupportedVersionMajor === applicationMajor)
                            hasCorrectMajorPackage = true;

                        if (hasCorrectMajorPackage && appSupportedVersionMajor > applicationMajor) {
                            this.alApps.splice(this.alApps.indexOf(alApp), 1);
                            return;
                        }
                    });
                });

                var groups = this.groupAppPackagesById();
                groups.forEach((alApps: ALApp[], appId: string) => {
                    alApps = alApps.sort((a, b) => compareVersions(a.appVersion, b.appVersion));
                    alApps.pop();

                    alApps.forEach(alApp => {
                        this.alApps.splice(this.alApps.indexOf(alApp), 1);
                    });
                });

                console.log(groups);
                console.log(this.alApps);
            }

            resolve();
        });
    }

    groupAppPackagesById(): Map<string, ALApp[]> {
        var groups = new Map<string, ALApp[]>();

        for (let index = 0; index < this.alApps.filter(app => app.appType === AppType.appPackage).length; index++) {
            const alApp = this.alApps.filter(app => app.appType === AppType.appPackage)[index];
            var apps = groups.get(alApp.appId);
            if (apps === undefined)
                apps = [];

            apps.push(alApp);
            groups.set(alApp.appId, apps);
        }

        return groups;
    }

    async readAppPackages(alApps: ALApp[], mode?: Mode) {
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

                        await reader.getAppAlFiles(alApp, mode, (a, m) => {
                            progress.report({ message: `${alApp.appName} (${a} of ${m})` });
                        });

                        alApp.appChanged = false;
                    }

                    // console.log(extensionPrefix + `Duration: ${(Date.now() - start)}`);
                    HelperFunctions.fillMissingObjectNames(reader.alApps);
                    resolve('');
                };
                start();
            });

            this.isReadingApp = false;
            return true;
        });
    }

    /**
     * Gets a list of ALObjects out of a list of .al files
     * @param alFiles Paths of the .al files
     * @param alApp The app file the .al files belong to
     * @param updateCallback The callback function for updates
     * @returns 
     */
    private getAlFiles(alFiles: string[], alApp: ALApp, mode?: Mode, updateCallback?: (alreadyDone: number, maxNumber: number) => void): Promise<void> {
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

            let promise1 = this.getAlFilesPromise(alFiles.splice(0, length), alApp, mode, () => { update(); });
            let promise2 = this.getAlFilesPromise(alFiles, alApp, mode, () => { update(); });
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

    /**
     * Reads a list of ALObjects out of a list of .al files
     * @param alFiles Paths of the .al files
     * @param alApp The app file the .al files belong to
     * @param updateCallback The callback function for updates
     * @returns Returns a list of ALObjects
     */
    private getAlFilesPromise(alFiles: string[], alApp: ALApp, mode?: Mode, updateCallback?: () => void): Promise<ALObject[]> {
        return new Promise<ALObject[]>(async (resolve) => {
            let reader = this;
            let alObjects: ALObject[] = [];
            for (let i = 0; i < alFiles.length; i++) {
                if (updateCallback) { updateCallback(); }

                let alObject = await reader.readAlFile(alFiles[i], alApp, undefined, mode);
                if (alObject) {
                    alObjects.push(alObject);
                }
            }
            resolve(alObjects);
        });
    }

    /**
     * Gets a list of ALObjects out of a app package
     * @param alApp The app file from which the .al files should be read
     * @param updateCallback The callback function for updates
     * @returns 
     */
    private getAppAlFiles(alApp: ALApp, mode?: Mode, updateCallback?: (alreadyDone: number, maxNumber: number) => void): Promise<void> {
        return new Promise<void>(async (resolve) => {
            let reader = this;

            const jsZip = await HelperFunctions.readZip(alApp.appRootPath);
            if (!jsZip) {
                resolve();
                return;
            }

            if (!alApp.showMyCode) {
                await reader.getAlFilesSymbolReference(alApp, updateCallback);

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

            let promise1 = this.getAppAlFilesPromise(jsZip, alFiles.splice(0, length), alApp, mode, () => { update(); });
            let promise2 = this.getAppAlFilesPromise(jsZip, alFiles, alApp, mode, () => { update(); });
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

    //#region Symbol Reference
    private getAlFilesSymbolReference(alApp: ALApp, updateCallback?: (alreadyDone: number, maxNumber: number) => void): Promise<void> {
        return new Promise<void>(async (resolve) => {
            let reader = this;

            const jsZip = await HelperFunctions.readZip(alApp.appRootPath);
            if (!jsZip) {
                resolve();
                return;
            }

            const symbolReferenceBuffer: Buffer | undefined = await jsZip.file('SymbolReference.json')?.async("nodebuffer");
            if (!symbolReferenceBuffer) {
                resolve();
                return;
            }

            const UTF8_BOM = "\u{FEFF}"
            let json = symbolReferenceBuffer.toString('utf8').replace(/\0/g, '');

            if (json.startsWith(UTF8_BOM)) {
                // Remove the BOM
                json = json.substring(UTF8_BOM.length);
            }

            let symbolReference = JSON.parse(json);
            const codeunits: Array<any> = symbolReference.Codeunits;
            const controlAddIns: Array<any> = symbolReference.ControlAddIns;
            const enumExtensions: Array<any> = symbolReference.EnumExtensionTypes;
            const enums: Array<any> = symbolReference.EnumTypes;
            const interfaces: Array<any> = symbolReference.Interfaces;
            const pageCustomizations: Array<any> = symbolReference.PageCustomizations;
            const pageExtensions: Array<any> = symbolReference.PageExtensions;
            const pages: Array<any> = symbolReference.Pages;
            const profileExtensions: Array<any> = symbolReference.ProfileExtensions;
            const profiles: Array<any> = symbolReference.Profiles;
            const queries: Array<any> = symbolReference.Queries;
            const reports: Array<any> = symbolReference.Reports;
            const tableExtensions: Array<any> = symbolReference.TableExtensions;
            const tables: Array<any> = symbolReference.Tables;
            const xmlPorts: Array<any> = symbolReference.XmlPorts;

            let alreadyDoneCounter = 0;
            let maxLength = codeunits.length + controlAddIns.length + enumExtensions.length + enums.length + interfaces.length + pageExtensions.length + pages.length +
                profileExtensions.length + profiles.length + queries.length + reports.length + tableExtensions.length + tables.length + xmlPorts.length;

            var update = (): void => {
                alreadyDoneCounter++;
                if (updateCallback) {
                    updateCallback(alreadyDoneCounter, maxLength);
                }
            };

            //#region Codeunits
            for (let i = 0; i < codeunits.length; i++) {
                const codeunit = codeunits[i];
                let alObject = new ALCodeunit(codeunit.ReferenceSourceFileName, codeunit.Id, codeunit.Name, alApp);
                alObject.setProperties(reader.getSymbolReferenceProperties(codeunit.Properties));
                alObject.functions = reader.getSymbolReferenceFunctions(codeunit.Methods);
                alObject.variables = reader.getSymbolReferenceVariables(codeunit.Variables);

                alApp.alObjects.push(alObject);
                update();
            }
            //#endregion

            //#region Interfaces
            for (let i = 0; i < interfaces.length; i++) {
                const alInterface = interfaces[i];
                let alObject = new ALInterface(alInterface.ReferenceSourceFileName, alInterface.Id, alInterface.Name, alApp);
                alObject.setProperties(reader.getSymbolReferenceProperties(alInterface.Properties));
                alObject.functions = reader.getSymbolReferenceFunctions(alInterface.Methods);
                alObject.variables = reader.getSymbolReferenceVariables(alInterface.Variables);

                alApp.alObjects.push(alObject);
                update();
            }
            //#endregion

            //#region Tables
            for (let i = 0; i < tables.length; i++) {
                const table = tables[i];
                let alObject = new ALTable(table.ReferenceSourceFileName, table.Id, table.Name, alApp);
                alObject.setProperties(reader.getSymbolReferenceProperties(table.Properties));
                alObject.functions = reader.getSymbolReferenceFunctions(table.Methods);
                alObject.variables = reader.getSymbolReferenceVariables(table.Variables);

                if (table.Fields !== undefined) {
                    for (let j = 0; j < table.Fields.length; j++) {
                        const field = table.Fields[j];
                        const tableField = new ALTableField(field.Id, field.Name, reader.getSymbolReferenceTypeDefinition(field.TypeDefinition), 0);
                        tableField.properties = reader.getSymbolReferenceProperties(field.Properties);

                        alObject.fields.push(tableField);
                    }
                }

                alApp.alObjects.push(alObject);
                update();
            }
            //#endregion

            //#region Table Extensions
            for (let i = 0; i < tableExtensions.length; i++) {
                const tableExtension = tableExtensions[i];
                let alObject = new ALTableExtension(tableExtension.ReferenceSourceFileName, tableExtension.Id, tableExtension.Name, alApp);
                alObject.setProperties(reader.getSymbolReferenceProperties(tableExtension.Properties));
                alObject.functions = reader.getSymbolReferenceFunctions(tableExtension.Methods);
                alObject.variables = reader.getSymbolReferenceVariables(tableExtension.Variables);

                if (tableExtension.Fields !== undefined) {
                    for (let j = 0; j < tableExtension.Fields.length; j++) {
                        const field = tableExtension.Fields[j];
                        const tableField = new ALTableField(field.Id, field.Name, reader.getSymbolReferenceTypeDefinition(field.TypeDefinition), 0);
                        tableField.properties = reader.getSymbolReferenceProperties(field.Properties);

                        alObject.fields.push(tableField);
                    }
                }

                alApp.alObjects.push(alObject);
                update();
            }
            //#endregion

            //#region Enums
            for (let i = 0; i < enums.length; i++) {
                const alEnum = enums[i];

                let alObject = new ALEnum(alEnum.ReferenceSourceFileName, alEnum.Id, alEnum.Name, alApp);
                alObject.setProperties(reader.getSymbolReferenceProperties(alEnum.Properties));
                alObject.functions = reader.getSymbolReferenceFunctions(alEnum.Methods);
                alObject.variables = reader.getSymbolReferenceVariables(alEnum.Variables);

                if (alEnum.Values !== undefined) {
                    for (let j = 0; j < alEnum.Values.length; j++) {
                        const enumValue = alEnum.Values[j];
                        const enumField = new ALEnumField(enumValue.Ordinal, enumValue.Name);
                        enumField.properties = reader.getSymbolReferenceProperties(enumValue.Properties);

                        alObject.fields.push(enumField);
                    }
                }

                alApp.alObjects.push(alObject);
                update();
            }
            //#endregion

            //#region Enum Extensions
            for (let i = 0; i < enumExtensions.length; i++) {
                const alEnumExtension = enumExtensions[i];

                let alObject = new ALEnumExtension(alEnumExtension.ReferenceSourceFileName, alEnumExtension.Id, alEnumExtension.Name, alApp);
                alObject.setProperties(reader.getSymbolReferenceProperties(alEnumExtension.Properties));
                alObject.functions = reader.getSymbolReferenceFunctions(alEnumExtension.Methods);
                alObject.variables = reader.getSymbolReferenceVariables(alEnumExtension.Variables);

                if (alEnumExtension.Values !== undefined) {
                    for (let j = 0; j < alEnumExtension.Values.length; j++) {
                        const enumValue = alEnumExtension.Values[j];
                        const enumField = new ALEnumField(enumValue.Ordinal, enumValue.Name);
                        enumField.properties = reader.getSymbolReferenceProperties(enumValue.Properties);

                        alObject.fields.push(enumField);
                    }
                }

                alApp.alObjects.push(alObject);
                update();
            }
            //#endregion

            //#region Pages
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                let alObject = new ALPage(page.ReferenceSourceFileName, page.Id, page.Name, alApp);
                alObject.setProperties(reader.getSymbolReferenceProperties(page.Properties));
                alObject.functions = reader.getSymbolReferenceFunctions(page.Methods);
                alObject.variables = reader.getSymbolReferenceVariables(page.Variables);

                alObject.controls = reader.getSymbolReferenceControls(page.Controls);
                alObject.actions = reader.getSymbolReferenceActions(page.Actions);

                alApp.alObjects.push(alObject);
                update();
            }
            //#endregion

            //#region Page Extensions
            for (let i = 0; i < pageExtensions.length; i++) {
                const pageExtension = pageExtensions[i];
                let alObject = new ALPageExtension(pageExtension.ReferenceSourceFileName, pageExtension.Id, pageExtension.Name, alApp);
                alObject.setTempParentObjectFromType(pageExtension.TargetObject);

                alObject.setProperties(reader.getSymbolReferenceProperties(pageExtension.Properties));
                alObject.functions = reader.getSymbolReferenceFunctions(pageExtension.Methods);
                alObject.variables = reader.getSymbolReferenceVariables(pageExtension.Variables);

                alObject.controls = reader.getSymbolReferenceControls(pageExtension.ControlChanges, true);
                alObject.actions = reader.getSymbolReferenceActions(pageExtension.ActionChanges, true);

                alApp.alObjects.push(alObject);
                update();
            }
            //#endregion

            //#region Page Customizations
            for (let i = 0; i < pageCustomizations.length; i++) {
                const pageCustomization = pageCustomizations[i];
                let alObject = new ALPageCustomization(pageCustomization.ReferenceSourceFileName, pageCustomization.Id, pageCustomization.Name, alApp);
                alObject.setTempParentObjectFromType(pageCustomization.TargetObject);

                alObject.setProperties(reader.getSymbolReferenceProperties(pageCustomization.Properties));
                alObject.functions = reader.getSymbolReferenceFunctions(pageCustomization.Methods);
                alObject.variables = reader.getSymbolReferenceVariables(pageCustomization.Variables);

                alObject.controls = reader.getSymbolReferenceControls(pageCustomization.ControlChanges, true);
                alObject.actions = reader.getSymbolReferenceActions(pageCustomization.ActionChanges, true);

                alApp.alObjects.push(alObject);
                update();
            }
            //#endregion

            for (let i = 0; i < enums.length; i++) {
                const alEnum = enums[i];

                let alObject = new ALEnum(alEnum.ReferenceSourceFileName, alEnum.Id, alEnum.Name, alApp);
                alObject.properties = reader.getSymbolReferenceProperties(alEnum.Properties);
                alObject.functions = reader.getSymbolReferenceFunctions(alEnum.Methods);

                if (alEnum.Values !== undefined) {
                    for (let j = 0; j < alEnum.Values.length; j++) {
                        const enumValue = alEnum.Values[j];
                        const enumField = new ALEnumField(enumValue.Ordinal, enumValue.Name);
                        enumField.properties = reader.getSymbolReferenceProperties(enumValue.Properties);

                        alObject.fields.push(enumField);
                    }
                }

                alApp.alObjects.push(alObject);
                update();
            }

            //#region Table Extensions
            for (let i = 0; i < tableExtensions.length; i++) {
                const tableExtension = tableExtensions[i];
                let alObject = new ALTableExtension(tableExtension.ReferenceSourceFileName, tableExtension.Id, tableExtension.Name, alApp);
                alObject.properties = reader.getSymbolReferenceProperties(tableExtension.Properties);
                alObject.functions = reader.getSymbolReferenceFunctions(tableExtension.Methods);
                alObject.variables = reader.getSymbolReferenceVariables(tableExtension.Variables);

                if (tableExtension.Fields !== undefined) {
                    for (let j = 0; j < tableExtension.Fields.length; j++) {
                        const field = tableExtension.Fields[j];
                        const tableField = new ALTableField(field.Id, field.Name, reader.getSymbolReferenceTypeDefinition(field.TypeDefinition), 0);
                        tableField.properties = reader.getSymbolReferenceProperties(field.Properties);

                        alObject.fields.push(tableField);
                    }
                }

                alApp.alObjects.push(alObject);
                update();
            }
            //#endregion

            //#region Enums
            for (let i = 0; i < enums.length; i++) {
                const alEnum = enums[i];

                let alObject = new ALEnum(alEnum.ReferenceSourceFileName, alEnum.Id, alEnum.Name, alApp);
                alObject.setProperties(reader.getSymbolReferenceProperties(alEnum.Properties));
                alObject.functions = reader.getSymbolReferenceFunctions(alEnum.Methods);
                alObject.variables = reader.getSymbolReferenceVariables(alEnum.Variables);

                if (alEnum.Values !== undefined) {
                    for (let j = 0; j < alEnum.Values.length; j++) {
                        const enumValue = alEnum.Values[j];
                        const enumField = new ALEnumField(enumValue.Ordinal, enumValue.Name);
                        enumField.properties = reader.getSymbolReferenceProperties(enumValue.Properties);

                        alObject.fields.push(enumField);
                    }
                }

                alApp.alObjects.push(alObject);
                update();
            }
            //#endregion

            //#region Enum Extensions
            for (let i = 0; i < enumExtensions.length; i++) {
                const alEnumExtension = enumExtensions[i];

                let alObject = new ALEnumExtension(alEnumExtension.ReferenceSourceFileName, alEnumExtension.Id, alEnumExtension.Name, alApp);
                alObject.setProperties(reader.getSymbolReferenceProperties(alEnumExtension.Properties));
                alObject.functions = reader.getSymbolReferenceFunctions(alEnumExtension.Methods);
                alObject.variables = reader.getSymbolReferenceVariables(alEnumExtension.Variables);

                if (alEnumExtension.Values !== undefined) {
                    for (let j = 0; j < alEnumExtension.Values.length; j++) {
                        const enumValue = alEnumExtension.Values[j];
                        const enumField = new ALEnumField(enumValue.Ordinal, enumValue.Name);
                        enumField.properties = reader.getSymbolReferenceProperties(enumValue.Properties);

                        alObject.fields.push(enumField);
                    }
                }

                alApp.alObjects.push(alObject);
                update();
            }
            //#endregion

            //#region Pages
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                let alObject = new ALPage(page.ReferenceSourceFileName, page.Id, page.Name, alApp);
                alObject.setProperties(reader.getSymbolReferenceProperties(page.Properties));
                alObject.functions = reader.getSymbolReferenceFunctions(page.Methods);
                alObject.variables = reader.getSymbolReferenceVariables(page.Variables);

                // loop through controls
                // Kind 0 -> Area
                // Kind 1 -> Group
                // Kind 8 -> Field
                alObject.controls = reader.getSymbolReferenceControls(page.Controls);
                alObject.actions = reader.getSymbolReferenceActions(page.Actions);

                alApp.alObjects.push(alObject);
                update();
            }
            //#endregion

            //#region Page Extensions
            for (let i = 0; i < pageExtensions.length; i++) {
                const pageExtension = pageExtensions[i];
                let alObject = new ALPageExtension(pageExtension.ReferenceSourceFileName, pageExtension.Id, pageExtension.Name, alApp);
                alObject.setTempParentObjectFromType(pageExtension.TargetObject);

                alObject.setProperties(reader.getSymbolReferenceProperties(pageExtension.Properties));
                alObject.functions = reader.getSymbolReferenceFunctions(pageExtension.Methods);
                alObject.variables = reader.getSymbolReferenceVariables(pageExtension.Variables);

                alObject.controls = reader.getSymbolReferenceControls(pageExtension.ControlChanges, true);
                alObject.actions = reader.getSymbolReferenceActions(pageExtension.ActionChanges, true);

                alApp.alObjects.push(alObject);
                update();
            }
            //#endregion

            resolve();
            return;
        });
    }

    private getSymbolReferenceControls(controlsArray: any, isChanges: Boolean = false): ALPageControl[] {
        const controls: ALPageControl[] = [];

        if (controlsArray === undefined)
            return controls;

        for (let i = 0; i < controlsArray.length; i++) {
            const control = controlsArray[i];

            var pageControl: ALPageControl;
            if (isChanges) {
                if (!(control.ChangeKind in PageControlChangeKind))
                    continue;

                pageControl = ALPageControl.pageExtensionControl(control.ChangeKind, control.Id, control.Anchor);
            }
            else {
                if (!(control.Kind in PageControlKind))
                    continue;

                pageControl = ALPageControl.pageControl(control.Kind, control.Id, control.Name);
            }

            pageControl.setProperties(this.getSymbolReferenceProperties(control.Properties));
            pageControl.subControls = this.getSymbolReferenceControls(control.Controls);

            controls.push(pageControl);
        }

        return controls;
    }

    private getSymbolReferenceActions(actionsArray: any, isChanges: Boolean = false): ALPageAction[] {
        const actions: ALPageAction[] = [];

        if (actionsArray === undefined)
            return actions;

        for (let i = 0; i < actionsArray.length; i++) {
            const action = actionsArray[i];

            var pageAction: ALPageAction;
            if (isChanges) {
                if (!(action.ChangeKind in PageActionChangeKind))
                    continue;

                pageAction = ALPageAction.pageExtensionAction(action.ChangeKind, action.Id, action.Anchor);
            }
            else {
                if (!(action.Kind in PageActionKind))
                    continue;

                pageAction = ALPageAction.pageAction(action.Kind, action.Id, action.Name);
            }

            pageAction.setProperties(this.getSymbolReferenceProperties(action.Properties));
            pageAction.actions = this.getSymbolReferenceActions(action.Actions);

            actions.push(pageAction);
        }

        return actions;
    }

    private getSymbolReferenceTypeDefinition(typeDefinition: any): string {
        let type = typeDefinition.Name;
        if (typeDefinition.Subtype !== undefined) {
            type += ` "${typeDefinition.Subtype.Name}"`;
        }

        return type;
    }

    private getSymbolReferenceFunctions(methodsArray: any): ALFunction[] {
        const methods: ALFunction[] = [];

        if (methodsArray === undefined)
            return methods;

        for (let j = 0; j < methodsArray.length; j++) {
            const method = methodsArray[j];

            const parameters: ALVariable[] = [];
            parameters.concat(this.getSymbolReferenceVariables(method.Parameters));

            // TODO: Check Attributes.Name if function is Event

            const isLocal: boolean = (method.IsLocal === undefined) ? false : method.IsLocal;
            methods.push(new ALFunction(FunctionType.Standard, method.Name, { lineNo: 0, parameters: parameters, returnValue: undefined, isLocal: isLocal }));
        }

        return methods;
    }

    private getSymbolReferenceVariables(variablesArray: any): ALVariable[] {
        const variables: ALVariable[] = [];

        if (variablesArray === undefined)
            return variables;

        for (let k = 0; k < variablesArray.length; k++) {
            const variable = variablesArray[k];
            let subtype = "";
            if (variable.TypeDefinition.Subtype !== undefined) {
                subtype = `"${variable.TypeDefinition.Subtype.Name}"`;
            }

            const isVar: boolean = (variable.IsVar === undefined) ? false : variable.IsVar;
            const isTemporary: boolean = (variable.TypeDefinition.Temporary === undefined) ? false : variable.TypeDefinition.Temporary;
            variables.push(new ALVariable(variable.Name, variable.TypeDefinition.Name, subtype, 0, { isTemporary: isTemporary, isVar: isVar }))
        }

        return variables;
    }

    private getSymbolReferenceProperties(propertiesArray: any): Map<string, string> {
        const properties: Map<string, string> = new Map<string, string>();

        if (propertiesArray === undefined)
            return properties;

        for (let i = 0; i < propertiesArray.length; i++) {
            const element = propertiesArray[i];
            properties.set(element.Name, element.Value);
        }

        return properties;
    }
    //#endregion

    /**
     * Reads a list of ALObjects out of a list of .al files in a zip
     * @param jsZip The app as zip file
     * @param alFiles Paths of the .al files
     * @param alApp The app file the .al files belong to
     * @param updateCallback The callback function for updates
     * @returns 
     */
    private getAppAlFilesPromise(jsZip: JSZip, alFiles: string[], alApp: ALApp, mode?: Mode, updateCallback?: () => void): Promise<ALObject[]> {
        return new Promise<ALObject[]>(async (resolve) => {
            let reader = this;
            let alObjects: ALObject[] = [];
            for await (const alFile of alFiles) {
                if (updateCallback) { updateCallback(); }

                const contentBuffer: Buffer | undefined = await jsZip.file(alFile)?.async("nodebuffer");
                if (!contentBuffer || contentBuffer.length <= 0) {
                    continue;
                }

                const readable = Readable.from(contentBuffer);
                let alObject = await reader.readAlFile(alFile, alApp, readable, mode);
                if (alObject) {
                    alObjects.push(alObject);
                }
            }
            resolve(alObjects);
        });
    }

    //#region Read single .al file
    /**
     * Read a ALObject again with full scan
     * @param alObject The ALObject which should be read again
     * @returns The new ALObject
     */
    readAlObject(alObject: ALObject): Promise<ALObject> {
        return new Promise<ALObject>(async (resolve) => {
            let reader = this;

            if (!alObject) {
                return;
            }

            let zipPath: string | undefined = HelperFunctions.getZipPath(alObject);
            if (!zipPath) {
                return undefined;
            }
            let jsZip = await HelperFunctions.readZip(zipPath);
            if (!jsZip) {
                return undefined;
            }

            const contentBuffer: Buffer | undefined = await jsZip.file(alObject.objectPath)?.async("nodebuffer");
            if (!contentBuffer || contentBuffer.length <= 0) {
                resolve(alObject);
                return alObject;
            }

            const readable = Readable.from(contentBuffer);
            let newAlObject = await reader.readAlFile(alObject.objectPath, alObject.alApp, readable, Mode.Normal);

            if (newAlObject) {
                alObject = newAlObject;
            }

            resolve(alObject);
            return alObject;
        });
    }

    /**
     * Reads a .al file for it symbols
     * @param filePath The path to the .al file
     * @param alApp The app file the .al file belongs to
     * @param readable The file as readable (if it exists)
     * @returns Returns the read ALObject or undefined if no object was found
     */
    private readAlFile(filePath: string, alApp: ALApp, readable?: Readable, forcedMode?: Mode): Promise<ALObject | undefined> {
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
                        const tempALObject = reader.readObjectDefinition(line, filePath, alApp);
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
                        if ((forcedMode && (forcedMode as Mode) != Mode.ForceInternal) && reader.mode === Mode.HyperPerformance) {
                            cb(false);
                            return false;
                        }

                        if (forcedMode === undefined) {
                            // Finish searching because of user preferences
                            if (reader.mode == Mode.Performance || reader.mode == Mode.HyperPerformance) {
                                cb(false);
                                return false;
                            }
                        }

                        if (forcedMode !== undefined) {
                            if (forcedMode == Mode.Performance || forcedMode == Mode.HyperPerformance) {
                                cb(false);
                                return false;
                            }
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

                        currentFunction = reader.checkIfProcedure(line, lineNo, alObject, nextFunctionType, nextFunctionArgument);
                        if (currentFunction) {
                            collectionVariables = false;
                        }
                        nextFunctionArgument = undefined;
                        nextFunctionType = reader.checkIfEvent(line);

                        // if event subscriber, get informations of the subscriber
                        if (nextFunctionType === FunctionType.EventSubscriber) {
                            nextFunctionArgument = reader.checkIfEventSubscriber(line);
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

    readObjectDefinition(lineText: string, filePath: string, alApp: ALApp): ALObject | undefined {
        const alObjectPattern = /^([a-z]+)\s([0-9]+)\s([a-z0-9\_]+|\"[^\"]+\")(\sextends\s([a-z0-9\_]+|\"[^\"]+\")|[\s\{]?|)[\s\{]?/i;
        const alObjectNonIDPattern = /^([a-z0-9\_]+)(?: ([a-z0-9\_]+|\"[^\"]+\")|$)(?:\scustomizes\s([a-z0-9\_]+|\"[^\"]+\"))?$/i;

        let matches = alObjectPattern.exec(lineText);
        if (matches === null) {
            matches = alObjectNonIDPattern.exec(lineText);
            if (matches !== null) {
                let typeStr = matches[1];

                let name = "Type " + ObjectType[HelperFunctions.getObjectTypeFromString(typeStr)];
                if (matches[2] !== undefined)
                    name = HelperFunctions.removeNameSurrounding(matches[2]);

                let customizes = "";
                if (matches[3] !== undefined)
                    customizes = matches[3];

                matches.splice(0);
                matches.push(lineText);
                matches.push(typeStr);
                matches.push("");
                matches.push(name);
                matches.push("");
                matches.push(customizes);
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

    /**
     * Checks if the current line is any type of event
     * @param lineText The current line of code
     * @returns Returns the FunctionType found or undefined if it was no match
     */
    private checkIfEvent(lineText: string): FunctionType | undefined {
        const eventPattern = /\[([A-z]+)[^\]]*\]/i;
        let match = eventPattern.exec(lineText);

        if (!match) {
            return (undefined);
        }

        return ALFunction.getFunctionTypeByString(match[1]);
    }

    /**
     * Checks if the current line is a event subscriber
     * @param lineText The current line of code
     * @returns Returns the ALFunctionArgument found or undefined if it was no match
     */
    private checkIfEventSubscriber(lineText: string): ALFunctionArgument | undefined {
        const eventSubscriberPattern = /\[EventSubscriber\(ObjectType::([^,]+),\s?[^:]+::("[^"]+"|[^,]+),\s?'([^']*)',\s?'([^']*)'/i;
        let match = eventSubscriberPattern.exec(lineText);

        if (!match) {
            return (undefined);
        }

        return ALFunctionArgument.createEventSubscriber(match[1], match[2], match[3], match[4]);
    }

    /**
     * Checks if the current line is a procedure
     * @param lineText The current line of code
     * @param lineNo The current line number
     * @param alObject The ALObject the file belongs to
     * @param customFunctionType The current FunctionType, if not default function
     * @param functionArgument Any defined FunctionArguments, if any
     * @returns Return the ALFunction found or undefined if it was no match
     */
    private checkIfProcedure(lineText: string, lineNo: number, alObject: ALObject, customFunctionType?: FunctionType, functionArgument?: ALFunctionArgument): ALFunction | undefined {
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
    //#endregion

    //#region License Validation
    /**
     * Reads the detailed license report for license validation
     * @param licenseFilePath The detailed license report .txt file
     * @returns 
     */
    readLicenseReport(licenseFilePath: vscode.Uri): Promise<void> {
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
    //#endregion

    updateSetting(name: string, value: string) {
        const target = vscode.ConfigurationTarget.Global;
        this.workspaceConfig.update(name, value, target);
    }
}