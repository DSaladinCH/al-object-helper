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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reader = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs-extra");
const lineReader = require("line-reader");
const stream_1 = require("stream");
const internal_1 = require("./internal");
class Reader {
    constructor(context) {
        this.outputChannel = vscode.window.createOutputChannel("ALObjectHelper");
        this.workspaceConfig = vscode.workspace.getConfiguration();
        //alObjects: ALObject[] = [];
        this.alApps = [];
        this.printDebug = false;
        this.extensionContext = context;
        this.printDebug = this.workspaceConfig.get("alObjectHelper.printDebug");
        if (vscode.workspace.workspaceFolders) {
            vscode.workspace.workspaceFolders.forEach((element) => {
                var appPath = path.join(element.uri.fsPath, "app.json");
                if (fs.existsSync(appPath)) {
                    var json = fs.readJSONSync(appPath);
                    this.alApps.push(new internal_1.ALApp(internal_1.AppType.local, json.name, json.publisher, json.runtime, element.uri.fsPath));
                }
            });
        }
        vscode.workspace.onDidChangeConfiguration((e) => {
            // update configurations
            this.printDebug = this.workspaceConfig.get("alObjectHelper.printDebug");
        });
    }
    startReading() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.printDebug) {
                this.outputChannel.appendLine("Start reading!");
            }
            let alFiles = [];
            for (let index = 0; index < this.alApps.length; index++) {
                const alApp = this.alApps[index];
                yield this.discoverAppPackages(alApp);
            }
            if (this.printDebug) {
                this.outputChannel.appendLine(`Found ${this.alApps.filter(alApp => alApp.appType === internal_1.AppType.appPackage).length} app files in all projects`);
            }
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Reading local objects - Current"
            }, (progress, token) => __awaiter(this, void 0, void 0, function* () {
                yield new Promise((resolve) => {
                    let reader = this;
                    const start = function () {
                        return __awaiter(this, void 0, void 0, function* () {
                            var start = Date.now();
                            var alApps = reader.alApps.filter(app => app.appType === internal_1.AppType.local);
                            var quotient = Math.floor(100 / alApps.length);
                            console.log(internal_1.extensionPrefix + `Found ${alApps.length} workspace folders`);
                            for (let i = 0; i < alApps.length; i++) {
                                const alApp = alApps[i];
                                progress.report({ message: `${alApp.appName} (0 of 0)`, increment: quotient });
                                console.log(internal_1.extensionPrefix + `Found project "${alApp.appName}" with path "${alApp.appPath}"`);
                                if (reader.printDebug) {
                                    reader.outputChannel.appendLine(`Search al files in local project "${alApp.appName}"`);
                                }
                                let files = yield internal_1.HelperFunctions.getFiles(alApp.appPath, 'al');
                                if (reader.printDebug) {
                                    reader.outputChannel.appendLine(`Found ${files.length} al files in local project "${alApp.appName}"`);
                                }
                                alFiles = alFiles.concat(files);
                                yield reader.getALSymbols(files, alApp, (a, m) => {
                                    progress.report({ message: `${alApp.appName} (${a} of ${m})` });
                                });
                            }
                            console.log(internal_1.extensionPrefix + `Duration: ${(Date.now() - start)}`);
                            resolve('');
                        });
                    };
                    start();
                });
                console.log(internal_1.extensionPrefix + `Found ${alFiles.length} AL Files`);
                if (this.printDebug) {
                    this.outputChannel.appendLine(`Found ${alFiles.length} al files in all local projects`);
                }
                let objectCount = 0;
                this.alApps.filter(app => app.appType === internal_1.AppType.local).forEach(app => objectCount += app.alObjects.length);
                console.log(internal_1.extensionPrefix + `Found ${objectCount} AL Objects`);
                if (this.printDebug) {
                    if (alFiles.length - objectCount > 0) {
                        this.outputChannel.appendLine(`Found ${objectCount} al objects, so ${alFiles.length - objectCount} objects could not be read or are not supported yet`);
                    }
                    else {
                        this.outputChannel.appendLine(`Found ${objectCount} al objects`);
                    }
                }
                var file = fs.createWriteStream('C:\\temp\\alFiles.txt');
                file.on('error', function (err) { });
                alFiles.forEach(function (v) { file.write(v + '\n'); });
                file.end();
                var file2 = fs.createWriteStream('C:\\temp\\alObjects.txt');
                file2.on('error', function (err) { });
                this.alApps.filter(app => app.appType === internal_1.AppType.local).forEach(alApp => {
                    alApp.alObjects.forEach(function (v) { file2.write(v.objectPath + '\n'); });
                });
                file2.end();
                return true;
            }));
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Reading app packages - Current"
            }, (progress, token) => __awaiter(this, void 0, void 0, function* () {
                yield new Promise((resolve) => {
                    let reader = this;
                    const start = function () {
                        return __awaiter(this, void 0, void 0, function* () {
                            var start = Date.now();
                            var alApps = reader.alApps.filter(app => app.appType === internal_1.AppType.appPackage);
                            var quotient = Math.floor(100 / alApps.length);
                            for (let i = 0; i < alApps.length; i++) {
                                const alApp = alApps[i];
                                progress.report({ message: `${alApp.appName} (0 of 0)`, increment: quotient });
                                console.log(internal_1.extensionPrefix + `Found app package "${alApp.appName}" with path "${alApp.appPath}"`);
                                if (reader.printDebug) {
                                    reader.outputChannel.appendLine(`Search al files in app package "${alApp.appName}"`);
                                }
                                yield reader.getAppALSymbols(alApp, (a, m) => {
                                    progress.report({ message: `${alApp.appName} (${a} of ${m})` });
                                });
                            }
                            console.log(internal_1.extensionPrefix + `Duration: ${(Date.now() - start)}`);
                            resolve('');
                        });
                    };
                    start();
                });
                return true;
            }));
        });
    }
    getLstat(filePath) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            yield fs.lstat(filePath, function (error, stats) {
                resolve(stats);
            });
        }));
    }
    /**
     * Get all al objects out of real al files
     * @param alFiles Paths of al files
     * @param alApp The app file which these al files belong to
     * @returns
     */
    getALSymbols(alFiles, alApp, updateCallback) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let alreadyDoneCounter = 0;
            let maxLength = alFiles.length;
            let length = Math.ceil(alFiles.length / 2);
            var update = () => {
                alreadyDoneCounter++;
                if (updateCallback) {
                    updateCallback(alreadyDoneCounter, maxLength);
                }
            };
            let promise1 = this.getAlSymbolsRange(alFiles.splice(0, length), alApp, () => { update(); });
            let promise2 = this.getAlSymbolsRange(alFiles, alApp, () => { update(); });
            let alObjects = [];
            yield Promise.all([promise1, promise2]).then((results) => {
                results.forEach(element => {
                    alObjects = alObjects.concat(element);
                });
            });
            alApp.addObjects(alObjects);
            resolve();
        }));
    }
    getAlSymbolsRange(alFiles, alApp, updateCallback) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let reader = this;
            let alObjects = [];
            for (let i = 0; i < alFiles.length; i++) {
                if (updateCallback) {
                    updateCallback();
                }
                let alObject = yield reader.searchObjectInContent(alFiles[i], alApp);
                if (alObject) {
                    alObjects.push(alObject);
                }
            }
            resolve(alObjects);
        }));
    }
    /**
     * Get all al objects out of a app file
     * @param alApp The app file which should be read
     * @returns
     */
    getAppALSymbols(alApp, updateCallback) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let reader = this;
            const jsZip = yield internal_1.HelperFunctions.readZip(alApp.appPath);
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
            let alObjects = [];
            let alreadyDoneCounter = 0;
            let maxLength = alFiles.length;
            let length = Math.ceil(alFiles.length / 2);
            var update = () => {
                alreadyDoneCounter++;
                if (updateCallback) {
                    updateCallback(alreadyDoneCounter, maxLength);
                }
            };
            let promise1 = this.getAppAlSymbolsRange(jsZip, alFiles.splice(0, length), alApp, () => { update(); });
            let promise2 = this.getAppAlSymbolsRange(jsZip, alFiles, alApp, () => { update(); });
            yield Promise.all([promise1, promise2]).then((results) => {
                results.forEach(element => {
                    alObjects = alObjects.concat(element);
                });
            });
            console.log(internal_1.extensionPrefix + "Time: " + (Date.now() - startDate));
            alApp.addObjects(alObjects);
            resolve();
        }));
    }
    getAppAlSymbolsRange(jsZip, alFiles, alApp, updateCallback) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            var e_1, _a;
            var _b;
            let reader = this;
            let alObjects = [];
            let i = 0;
            try {
                for (var alFiles_1 = __asyncValues(alFiles), alFiles_1_1; alFiles_1_1 = yield alFiles_1.next(), !alFiles_1_1.done;) {
                    const alFile = alFiles_1_1.value;
                    if (updateCallback) {
                        updateCallback();
                    }
                    i++;
                    const contentBuffer = yield ((_b = jsZip.file(alFile)) === null || _b === void 0 ? void 0 : _b.async("nodebuffer"));
                    if (!contentBuffer) {
                        continue;
                    }
                    const readable = stream_1.Readable.from(contentBuffer);
                    let alObject = yield reader.searchObjectInContent(alFile, alApp, readable);
                    if (alObject) {
                        if (i >= 50) {
                            i = 0;
                            console.log(internal_1.extensionPrefix + "Found one, yeah -> " + alObject.objectName);
                        }
                        alObjects.push(alObject);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (alFiles_1_1 && !alFiles_1_1.done && (_a = alFiles_1.return)) yield _a.call(alFiles_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            resolve(alObjects);
        }));
    }
    searchObjectInContent(filePath, alApp, readable) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            let reader = this;
            let alObject;
            try {
                let file = filePath;
                if (readable) {
                    file = readable;
                }
                let lineNo = -1;
                let firstLine = true;
                let currentFunction;
                let nextFunctionType;
                let collectionVariables = false;
                lineReader.eachLine(file, function (line, isLast, cb = () => __awaiter(this, void 0, void 0, function* () {
                    // Callback
                    if (firstLine) {
                        resolve(undefined);
                        return;
                    }
                    resolve(alObject);
                })) {
                    return __awaiter(this, void 0, void 0, function* () {
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
                            return true;
                        }
                        if (alObject.objectType === internal_1.ObjectType.Table || alObject.objectType === internal_1.ObjectType.TableExtension) {
                            if (/^\s*field\(/i.test(line)) {
                                currentFunction = undefined;
                                collectionVariables = false;
                                // is a table field
                                var tableFieldPattern = /field\(([0-9]+)\;\s?(\"[^\"]+\"|[a-z0-9\_]+)\;\s?([a-z0-9\[\]]+|Enum (\"[^\"]+\"|[a-z0-9\_]+))\)/i;
                                const match = tableFieldPattern.exec(line);
                                if (!match) {
                                    return true;
                                }
                                const fieldID = match[1];
                                const fieldName = match[2];
                                const fieldType = match[3];
                                const alTableField = new internal_1.ALTableField(fieldID, fieldName, fieldType, lineNo);
                                internal_1.ALTableField.addToObject(alObject, alTableField);
                                internal_1.ALTableField.addValidateEvent(alObject, alTableField);
                                return true;
                            }
                        }
                        else if (alObject.objectType === internal_1.ObjectType.Page || alObject.objectType === internal_1.ObjectType.PageExtension) {
                            if (alObject.objectType === internal_1.ObjectType.Page && alObject.sourceTable === undefined) {
                                var pageSourceTablePattern = /(?:SourceTable)\s?\=\s?([a-z0-9\_]+|\"[^\"]+\")\;/i;
                                const match = pageSourceTablePattern.exec(line);
                                if (match) {
                                    alObject.sourceTable = new internal_1.ALTable("", "", match[1], internal_1.ALApp.Empty());
                                    return true;
                                }
                            }
                            if (/^\s*field\(/i.test(line)) {
                                currentFunction = undefined;
                                collectionVariables = false;
                                // is a page field
                                var pageFieldPattern = /field\((\"[^\"]+\"|[a-z0-9\_]+)\;\s?(\"[^\"]+\"|[a-z0-9\_]+)\)/i;
                                const match = pageFieldPattern.exec(line);
                                if (!match) {
                                    return true;
                                }
                                const fieldID = match[1];
                                const fieldName = match[2];
                                const alPageField = new internal_1.ALPageField(fieldID, fieldName, lineNo);
                                internal_1.ALPageField.addToObject(alObject, alPageField);
                                internal_1.ALPageField.addValidateEvent(alObject, alPageField);
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
                                const match = internal_1.variablePattern.exec(line);
                                if (!match) {
                                    return true;
                                }
                                let isTemporary = false;
                                if (match[4]) {
                                    isTemporary = true;
                                }
                                else if (match[3].endsWith(" temporary")) {
                                    isTemporary = true;
                                }
                                currentFunction.variables.push(new internal_1.ALVariable(match[1], match[2], match[3], lineNo, { isTemporary: isTemporary, isVar: false }));
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
                            currentFunction = reader.getProcedure(line, lineNo, alObject, nextFunctionType);
                            if (currentFunction) {
                                collectionVariables = false;
                            }
                            nextFunctionType = reader.checkEventPublisher(line);
                            // check for a global variable after checking for a new function
                            if (collectionVariables) {
                                const match = internal_1.variablePattern.exec(line);
                                if (!match) {
                                    return true;
                                }
                                let isTemporary = false;
                                if (match[4]) {
                                    isTemporary = true;
                                }
                                else if (match[3].endsWith(" temporary")) {
                                    isTemporary = true;
                                }
                                alObject.variables.push(new internal_1.ALVariable(match[1], match[2], match[3], lineNo, { isTemporary: isTemporary, isVar: false }));
                                return true;
                            }
                            return true;
                        }
                    });
                });
            }
            catch (error) {
                console.log(internal_1.extensionPrefix + error.message);
                resolve(undefined);
            }
        }));
    }
    readFirstObjectLine(lineText, filePath, alApp) {
        const alObjectPattern = /^([a-z]+)\s([0-9]+)\s([a-z0-9\_]+|\"[^\"]+\")(\sextends\s([a-z0-9\_]+|\"[^\"]+\")|[\s\{]?|)[\s\{]?/i;
        let matches = alObjectPattern.exec(lineText);
        if (matches === null) {
            return undefined;
        }
        if (matches.length < 6) {
            return undefined;
        }
        let alObject;
        const typeStr = matches[1].trim().toLowerCase();
        const type = internal_1.HelperFunctions.getObjectTypeFromString(typeStr);
        if (type === internal_1.ObjectType.NotAvailable) {
            return undefined;
        }
        const id = matches[2].trim();
        const name = internal_1.HelperFunctions.removeNameSurrounding(matches[3].trim());
        alObject = internal_1.ALObject.getObjectFromType(type, filePath, id, name, alApp);
        if (!alObject) {
            return undefined;
        }
        // if group 4 is empty, it is not a extension object
        if (matches[5] === undefined) {
        }
        // if group 4 is not empty, it is a extension object
        else {
            const extendsName = internal_1.HelperFunctions.removeNameSurrounding(matches[5].trim());
            alObject.setTempParentObjectFromType(extendsName);
        }
        return alObject;
    }
    checkEventPublisher(lineText) {
        const eventPattern = /\[([A-z]+)[^\]]*\]/i;
        let match = eventPattern.exec(lineText);
        if (!match) {
            return (undefined);
        }
        return internal_1.HelperFunctions.getFunctionTypeByString(match[1]);
    }
    getProcedure(lineText, lineNo, alObject, customFunctionType) {
        try {
            const procedurePattern = /(local)?\s?(procedure|trigger) ([^(]*)\(([^)]*)?\)(?::\s?([^\s]+))?/i;
            let match = procedurePattern.exec(lineText);
            if (!match) {
                return undefined;
            }
            let functionType = internal_1.HelperFunctions.getFunctionTypeByString(match[2]);
            if (functionType === undefined) {
                return undefined;
            }
            const isLocal = match[1] !== undefined;
            const name = match[3];
            let parameters = [];
            if (match[4] !== undefined) {
                parameters = internal_1.ALFunction.convertParametersText(match[4], lineNo);
            }
            let returnValue = undefined;
            if (match[5] !== undefined) {
                const returnValuePattern = /\s?([^\s|;]+)( \"?([^"|\n|;]+)\"?)?/i;
                let match2 = returnValuePattern.exec(match[5]);
                if (match2) {
                    returnValue = new internal_1.ALVariable("", match2[1], match2[2], lineNo, { isTemporary: false, isVar: false });
                }
            }
            if (customFunctionType) {
                functionType = customFunctionType;
            }
            const alFunction = new internal_1.ALFunction(functionType, name, { lineNo: lineNo, parameters: parameters, returnValue: returnValue, isLocal: isLocal });
            alObject.functions.push(alFunction);
            return alFunction;
        }
        catch (error) {
            return undefined;
        }
    }
    discoverAppPackages(alApp) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            var e_2, _a;
            var _b;
            if (alApp.appType !== internal_1.AppType.local) {
                resolve();
                return;
            }
            if (this.printDebug) {
                this.outputChannel.appendLine(`Now search all app files in path ${alApp.appPath}`);
            }
            let appFiles = yield internal_1.HelperFunctions.getFiles(alApp.appPath + '.alpackages', 'app');
            if (this.printDebug) {
                this.outputChannel.appendLine(`Found ${appFiles.length} app files in path ${alApp.appPath}`);
            }
            try {
                for (var appFiles_1 = __asyncValues(appFiles), appFiles_1_1; appFiles_1_1 = yield appFiles_1.next(), !appFiles_1_1.done;) {
                    const appPath = appFiles_1_1.value;
                    if (this.printDebug) {
                        this.outputChannel.appendLine("");
                        this.outputChannel.appendLine(`Now reading app file ${appPath}`);
                    }
                    const jsZip = yield internal_1.HelperFunctions.readZip(appPath);
                    if (!jsZip) {
                        if (this.printDebug) {
                            this.outputChannel.appendLine(`Stop reading app file ${appPath} because of an error or a non existing app file`);
                        }
                        continue;
                    }
                    if (this.printDebug) {
                        this.outputChannel.appendLine(`Now extracting NavxManifest.xml from app file ${appPath}`);
                    }
                    const manifest = Object.keys(jsZip.files).find(fileName => fileName.endsWith("NavxManifest.xml"));
                    if (!manifest) {
                        continue;
                    }
                    if (this.printDebug) {
                        this.outputChannel.appendLine(`Creating buffer of NavxManifest.xml from app file ${appPath}`);
                    }
                    const contentBuffer = yield ((_b = jsZip.file(manifest)) === null || _b === void 0 ? void 0 : _b.async("nodebuffer"));
                    if (!contentBuffer) {
                        continue;
                    }
                    const content = contentBuffer.toString();
                    const manifestAppPattern = /<App.+Name="([^"]+)".+Publisher="([^"]+)".+Runtime="([^"]+)"/i;
                    if (this.printDebug) {
                        this.outputChannel.appendLine(`Extracting data of NavxManifest.xml from app file ${appPath}`);
                    }
                    const matches = manifestAppPattern.exec(content);
                    if (!matches) {
                        continue;
                    }
                    if (this.printDebug) {
                        this.outputChannel.appendLine(`Adding app file ${appPath} to array`);
                    }
                    if (!this.alApps.find(app => app.appName === matches[1] && app.appPublisher === matches[2])) {
                        this.alApps.push(new internal_1.ALApp(internal_1.AppType.appPackage, matches[1], matches[2], matches[3], appPath));
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (appFiles_1_1 && !appFiles_1_1.done && (_a = appFiles_1.return)) yield _a.call(appFiles_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
            if (this.printDebug) {
                this.outputChannel.appendLine("");
                this.outputChannel.appendLine(`Found all app files in ${alApp.appPath}`);
            }
            resolve();
        }));
    }
    updateSetting(name, value) {
        const target = vscode.ConfigurationTarget.Global;
        this.workspaceConfig.update(name, value, target);
    }
}
exports.Reader = Reader;
//# sourceMappingURL=Reader.js.map