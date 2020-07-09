const vscode = require('vscode');
const { workspace, ProgressLocation } = require("vscode");
const path = require("path");
const fs = require('fs-extra');
const del = require('del');
const JSZip = require('jszip');
const firstLine = require('firstline');
const os = require('os');
const readline = require('readline');
const ALObjectItem = require('./ALObjectItem');
const AppPackage = require('./AppPackage');
const ALObject = require('./ALObject');
const { file } = require('jszip');
const { worker } = require('cluster');

module.exports = class Reader {
    constructor(extensionContext) {
        this.alObjects = [];
        this.appPackages = [];
        this.appPackages.push(new AppPackage('Custom'));
        this.readLocalFiles = false;
        this.outputChannel = vscode.window.createOutputChannel("ALObjectHelper");
        this.extensionContext = extensionContext;
        this.rootPath = workspace.rootPath;
        this.alCachePath = this.rootPath.replace(/\\/g, '/') + '/.vscode/.alcache';
        this.baseAppFolderPath = path.join(os.tmpdir(), 'VSCode', path.basename(this.rootPath), 'ALObjectHelper').replace(/\\/g, '/');
    }

    generateAll(checkExists) {
        const reader = this;
        this.readLocalFiles = false;
        this.alObjects = [];
        this.appPackages = [];
        this.appPackages.push(new AppPackage('Custom'));

        if (!fs.existsSync(this.baseAppFolderPath))
            fs.mkdirSync(this.baseAppFolderPath, { recursive: true });

        fs.readdir(this.baseAppFolderPath, async function (error, files) {
            if (error)
                reader.outputChannel.appendLine(error.message);
            if (checkExists && files != undefined && files.length > 0) {
                //reader.appPackages.push(new AppPackage('Custom'));
                files.forEach(element => {
                    const appPackageName = path.basename(element);
                    reader.appPackages.push(new AppPackage((appPackageName.split('_')[0] + "_" + appPackageName.split('_')[1]).trim()));
                });

                reader.detectCustomAlFiles();
                // files.forEach(async element => {
                //     await reader.detectAllAlFiles(path.basename(element));
                // });
                vscode.window.withProgress({
                    location: ProgressLocation.Notification,
                    title: "Reading Objects"
                }, async (progress, token) => {
                    await new Promise((resolve) => {
                        const start = async () => {
                            for (let index = 0; index < files.length; index++) {
                                await reader.detectAllAlFiles(path.basename(files[index]));
                            }
                            resolve();
                        };
                        start();
                    });
                    return true;
                });
            }
            else {
                if (checkExists) {
                    if (files == undefined || files.length <= 0) {
                        await reader.detectCustomAlFiles();
                        vscode.window.withProgress({
                            location: ProgressLocation.Notification,
                            title: "Reading App Files"
                        }, async (progress, token) => {
                            await reader.readFiles();
                            return true;
                        });
                    }
                    else {
                        if (files != undefined && files.length > 0) {
                            await reader.detectCustomAlFiles();
                            vscode.window.withProgress({
                                location: ProgressLocation.Notification,
                                title: "Reading App Files"
                            }, async (progress, token) => {
                                await reader.readFiles();
                                return true;
                            });
                        }
                        else {
                            await reader.detectCustomAlFiles();
                            vscode.window.withProgress({
                                location: ProgressLocation.Notification,
                                title: "Reading App Files"
                            }, async (progress, token) => {
                                await reader.readFiles();
                                return true;
                            });
                        }
                    }
                }
                else {
                    vscode.window.withProgress({
                        location: ProgressLocation.Notification,
                        title: "Deleting all temporary Files"
                    }, async (progress, token) => {
                        await new Promise((resolve) => {
                            fs.emptyDir(reader.baseAppFolderPath, function (error) {
                                reader.extensionContext.globalState.update('reloaded', true);
                                vscode.commands.executeCommand('workbench.action.reloadWindow');
                                resolve();
                            });
                        });

                        return false;
                    });
                }
            }
        });
    }

    async readFiles() {
        const alPackagesPath = this.rootPath + "\\.alpackages";
        const appFilter = '.app';
        const reader = this;

        var appFiles = await reader.readDir(alPackagesPath, appFilter, this);
        var appPackages = [];

        var appFiles2 = [];
        appFiles.forEach(element => {
            var splittedName = path.basename(element).split('_');
            if (appPackages.indexOf((splittedName[0] + "_" + splittedName[1]).trim()) == -1) {
                appPackages.push((splittedName[0] + "_" + splittedName[1]).trim());
                appFiles2.push(element);
            }

            if (this.appPackages.find(element => element.packageName == (splittedName[0] + "_" + splittedName[1]).trim()) == undefined)
                this.appPackages.push(new AppPackage((splittedName[0] + "_" + splittedName[1]).trim()));
        });
        appFiles = appFiles2;

        return new Promise((resolve) => {
            appFiles.forEach(element => {
                this.readAppFile(element, reader, function () {
                    if (reader.allPackagesFinished()) {
                        reader.log("Finished all!");
                        reader.detectAllExtensions();
                        resolve();
                    }
                });
            });
        });
    }

    async readAppFile(appPath, reader, callback) {
        var splittedName = path.basename(appPath).split('_');
        const tempAppFileZip = path.join(os.tmpdir(), 'VSCode', path.basename(reader.rootPath), 'ALObjectHelper', splittedName[0] + "_" + splittedName[1] + '.zip');
        const tempAppFileZip2 = path.join(os.tmpdir(), 'VSCode', path.basename(reader.rootPath), 'ALObjectHelper', splittedName[0] + "_" + splittedName[1] + '2.zip');
        const baseAppFolderApp = reader.baseAppFolderPath + '/' + splittedName[0] + "_" + splittedName[1];

        if (reader.appPackages.find(element => element.packageName == (splittedName[0] + "_" + splittedName[1]).trim()) == undefined) {
            reader.appPackages.push(new AppPackage((splittedName[0] + "_" + splittedName[1]).trim()));
        }

        fs.copyFile(appPath, tempAppFileZip, async (error) => {
            if (error)
                reader.outputChannel.appendLine(error.message);

            reader.log("Copied App File to AL Cache");
            reader.output("Copied App File to AL Cache");
            try {
                fs.readFile(tempAppFileZip, function (error, data) {
                    if (error)
                        reader.outputChannel.appendLine(error);
                    JSZip.loadAsync(data, { createFolders: true }).then(function (zip) {
                        fs.unlinkSync(tempAppFileZip);
                        zip.remove('SymbolReference.json');
                        zip.remove('[Content_Types].xml');
                        zip.remove('MediaIdListing.xml');
                        zip.remove('navigation.xml');
                        zip.remove('NavxManifest.xml');
                        zip.remove('Translations');
                        zip.remove('layout');
                        zip.remove('ProfileSymbolReferences');
                        zip.remove('addin');
                        zip.remove('logo');
                        reader.log("Generating Buffer");
                        reader.output("Generating Buffer of " + splittedName[0] + "_" + splittedName[1]);
                        zip
                            .generateNodeStream({ type: 'nodebuffer', streamFiles: false })
                            .pipe(fs.createWriteStream(tempAppFileZip2))
                            .on('close', async function () {
                                reader.log("Generated Buffer");
                                reader.output("Generated Buffer of " + splittedName[0] + "_" + splittedName[1]);
                                var AdmZip = require('adm-zip');
                                var admZip = new AdmZip(tempAppFileZip2);

                                fs.exists(baseAppFolderApp, async function (exists) {
                                    if (!exists) {
                                        fs.ensureDir(baseAppFolderApp).then(async function (error) {
                                            reader.log("Unzipping File");
                                            reader.output("Unzipping File of " + splittedName[0] + "_" + splittedName[1]);
                                            admZip.extractAllTo(baseAppFolderApp, true);
                                            fs.unlinkSync(tempAppFileZip2);
                                            reader.log("Extracted App File");
                                            reader.output("Extracted App File of " + splittedName[0] + "_" + splittedName[1]);

                                            const packageName = splittedName[0] + "_" + splittedName[1];
                                            if (reader.appPackages.find(element => element.packageName == packageName.trim()) == undefined)
                                                reader.appPackages.push(new AppPackage(packageName.trim()));
                                            await reader.detectAllAlFiles(splittedName[0] + "_" + splittedName[1], function () {
                                                callback();
                                            });
                                        });
                                    }
                                    else {
                                        reader.log("Unzipping File");
                                        reader.output("Unzipping File of " + splittedName[0] + "_" + splittedName[1]);
                                        admZip.extractAllTo(baseAppFolderApp, false);
                                        fs.unlinkSync(tempAppFileZip2);
                                        reader.log("Extracted App File");
                                        reader.output("Extracted App File of " + splittedName[0] + "_" + splittedName[1]);

                                        const packageName = splittedName[0] + "_" + splittedName[1];
                                        if (reader.appPackages.find(element => element.packageName == packageName.trim()) == undefined)
                                            reader.appPackages.push(new AppPackage(packageName.trim()));
                                        await reader.detectAllAlFiles(splittedName[0] + "_" + splittedName[1], function () {
                                            callback();
                                        });
                                    }
                                });
                            });
                    });
                });
            }
            catch (err) {
                reader.log(err);
            }
        });
    }

    async emptyDirectory(path, reader, depth = 0) {
        return new Promise(async (resolve, reject) => {
            return fs.readdir(path, async function (error, files) {
                if (error)
                    reader.log(error.message);
                // Files found
                if (files != undefined && files.length > 0) {
                    for (let index = 0; index < files.length; index++) {
                        const element = files[index];
                        const filepath = path + '/' + element;
                        return await new Promise(() => {
                            fs.access(filepath, fs.constants.R_OK, async function (error) {
                                if (error)
                                    return;
                                return await new Promise(() => {
                                    fs.lstat(filepath, async function (error, stats) {
                                        if (error)
                                            reader.log(error.message);
                                        if (stats == undefined)
                                            return;

                                        if (stats.isDirectory()) {
                                            await new Promise(async (resolve, reject) => {
                                                await reader.emptyDirectory(filepath, reader, depth + 1);
                                            });
                                            if (depth != 0)
                                                await fs.rmdir(filepath);
                                        }
                                        else {
                                            new Promise(() => {
                                                fs.unlink(filepath);
                                            })
                                        }
                                    });
                                });
                            });
                        });
                    }
                }
            });
        })
    }

    async detectCustomAlFiles(callback = undefined, deleteAll = false, showSuccessfulMessage = true) {
        const alFilter = '.al';
        const packageName = 'Custom';

        var files = await this.readDir(this.rootPath, alFilter, this);
        this.log("Found " + files.length + " Custom AL Files");
        this.output("Found " + files.length + " Custom AL Files");

        if (this.appPackages.find(element => element.packageName == packageName.trim()) == undefined)
            this.appPackages.push(new AppPackage(packageName.trim()));
        else{
            const index = this.appPackages.findIndex(element => element.packageName == packageName.trim());
            this.appPackages[index].processed = false;
        }

        if (files.length == 0) {
            var foundIndex = this.appPackages.findIndex(a => a.packageName == packageName);
            this.appPackages[foundIndex].processed = true;
        }

        if (deleteAll)
            this.alObjects = this.alObjects.filter(element => element.appPackageName != 'Custom');

        var arrLen = files.length;
        var i = 0;
        files.forEach(async element => {
            var line = await firstLine(element);
            var alObject = this.getALObject(line, element);
            if (alObject == undefined) {
                const fileStream = fs.createReadStream(element);
                const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

                for await (const line of rl) {
                    alObject = this.getALObject(line, element);
                    if (alObject != undefined) {
                        break;
                    }
                }
            }

            if (alObject != undefined) {
                alObject.appPackageName = 'Custom';
                this.alObjects.push(alObject);
            }

            i++;
            if (i >= arrLen) {
                vscode.window.showInformationMessage("AL Object Helper: Found " + arrLen + " Custom AL Files");

                this.detectAllExtensions();
                var foundIndex = this.appPackages.findIndex(a => a.packageName == packageName);
                this.appPackages[foundIndex].processed = true;
                if (this.allPackagesFinished()) {
                    if (showSuccessfulMessage)
                        vscode.window.showInformationMessage("AL Object Helper: All AL files were successfully read out!");
                    this.log("Read all!");
                    this.output("Read all!");

                    this.alObjects.sort(function (a, b) {
                        var nameA = a.name.toUpperCase();
                        var nameB = b.name.toUpperCase();
                        if (nameA < nameB) {
                            return -1;
                        }
                        if (nameA > nameB) {
                            return 1;
                        }

                        return 0;
                    });
                    
                    if (callback != undefined)
                        callback();
                }
            }
        });
    }

    async detectAllAlFiles(appPackageName, callback = undefined) {
        const alFilter = '.al';
        const packageName = appPackageName.split('_')[0] + "_" + appPackageName.split('_')[1];

        var files2 = await this.readDir(this.baseAppFolderPath + "/" + appPackageName, alFilter, this);
        this.log("Found " + files2.length + " AL Files of " + appPackageName.split("_")[1]);
        this.output("Found " + files2.length + " AL Files of " + appPackageName.split("_")[1]);
        var arrLen2 = files2.length;
        var i2 = 0;

        if (this.appPackages.find(element => element.packageName == packageName.trim()) == undefined)
            this.appPackages.push(new AppPackage(packageName.trim()));

        if (files2.length == 0) {
            var foundIndex = this.appPackages.findIndex(a => a.packageName == packageName);
            this.appPackages[foundIndex].processed = true;
        }

        files2.forEach(async element => {
            var line = await firstLine(element);
            var alObject = this.getALObject(line, element);
            if (alObject == undefined) {
                const fileStream = fs.createReadStream(element);
                const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

                for await (const line of rl) {
                    alObject = this.getALObject(line, element);
                    if (alObject != undefined) {
                        break;
                    }
                }
            }
            if (alObject != undefined) {
                alObject.appPackageName = appPackageName;
                this.alObjects.push(alObject);
            }

            i2++;
            if (i2 >= arrLen2) {
                var foundIndex = this.appPackages.findIndex(a => a.packageName == packageName);
                this.appPackages[foundIndex].processed = true;
                if (this.allPackagesFinished()) {
                    vscode.window.showInformationMessage("AL Object Helper: All AL files were successfully read out!");
                    this.log("Read all!");
                    this.output("Read all!");

                    this.alObjects.sort(function (a, b) {
                        var nameA = a.name.toUpperCase();
                        var nameB = b.name.toUpperCase();
                        if (nameA < nameB) {
                            return -1;
                        }
                        if (nameA > nameB) {
                            return 1;
                        }

                        return 0;
                    });
                }

                if (callback != undefined)
                    callback();
            }
        });
    }

    async detectAllRDLCFiles() {
        const alFilter = '.al';

        var files = await this.readDir(this.rootPath, alFilter, this);
        this.log("Found " + files.length + " Custom AL Files");
        this.output("Found " + files.length + " Custom AL Files");

        var arrLen = files.length;
        var i = 0;
        files.forEach(async element => {
            var line = await firstLine(element);
            var alObject = this.getALObject(line, element);
            if (alObject != undefined)
                this.alObjects.push(alObject);
            i++;
            if (i >= arrLen - 1) {
                vscode.window.showInformationMessage("Found " + arrLen + " Custom AL Files");
                this.detectAllExtensions();
            }
        });
    }

    allPackagesFinished() {
        var allFinished = true;
        this.appPackages.forEach(element => {
            if (!element.processed) {
                allFinished = false;
                return false;
            }
        });
        return allFinished;
    }

    detectAllExtensions() {
        var arrLen = this.alObjects.length;
        var i = 0;
        this.alObjects.forEach(element => {
            element = this.findExtendsID(element);
            i++;
            if (i === arrLen - 1) {
                //console.log("All Objects linked");
                //vscode.window.showInformationMessage("Linked all Extensions to Standard Objects");
            }
        });
    }

    async readDir(startPath, filter, reader) {
        return new Promise(resolve => {
            fs.exists(startPath, function (exists) {
                if (!exists) {
                    reader.log("No dir " + startPath);
                    reader.output("No dir " + startPath);
                    resolve();
                    return;
                }
                else {
                    var length = 0;
                    var alFiles = [];
                    fs.readdir(startPath, async function (error, files) {
                        if (error)
                            this.outputChannel.appendLine(error);
                        for (var i = 0; i < files.length; i++) {
                            var filename = path.join(startPath, files[i]);
                            var stat = fs.lstatSync(filename);
                            if (stat.isDirectory()) {
                                var newALFiles = await reader.readDir(filename, filter, reader); //recurse
                                alFiles = alFiles.concat(newALFiles);
                            }
                            else if (filename.endsWith(filter)) {
                                //console.log('-- found: ',filename);
                                alFiles.push(filename);
                                length += 1;
                            };
                        };

                        resolve(alFiles);
                    });
                }
            });
        });
    }

    async openFile(input, appPackageName) {
        this.outputChannel.appendLine("Trying to open " + input + " of " + appPackageName);
        if (input == '' || input == undefined || typeof input !== 'string')
            return;

        input = input.toLowerCase();
        var longType = "";
        var type = input.substring(0, 2);
        var id = input.substring(2);
        var alObject;
        var cancelled = false;

        if (this.hasLetter(id)) {
            type = input.substring(0, 3);
            id = input.substring(3);
        }
        else if (this.hasNumber(type)) {
            type = input.substring(0, 1);
            id = input.substring(1);
        }

        var tempAlObjects = this.alObjects.filter(element => element.id == id);
        if (appPackageName != '')
            tempAlObjects = tempAlObjects.filter(element => element.appPackageName == appPackageName);

        this.outputChannel.appendLine("Searching...");
        switch (type) {
            case "t":
                alObject = tempAlObjects.find(element => element.type == "table");
                longType = "Table";
                break;
            case "p":
                alObject = tempAlObjects.find(element => element.type == "page");
                longType = "Page";
                break;
            case "c":
                alObject = tempAlObjects.find(element => element.type == "codeunit");
                longType = "Codeunit";
                break;
            case "r":
                alObject = tempAlObjects.find(element => element.type == "report");
                longType = "Report";
                break;
            case "x":
                alObject = tempAlObjects.find(element => element.type == "xmlport");
                longType = "XmlPort";
                break;
            case "e":
                alObject = tempAlObjects.find(element => element.type == "enum");
                longType = "Enum";
                break;
            case "te":
                if (appPackageName == '') {
                    const results = this.alObjects.filter(element => element.extendsType == "table" && element.extendsID == id);
                    if (results.length <= 1)
                        alObject = results[0];
                    else {
                        // Show options for multiple AL Objects
                        var alObjectItems = []
                        results.forEach(element => {
                            alObjectItems.push(new ALObjectItem(element));
                        });
                        const selectedItem = await vscode.window.showQuickPick(alObjectItems, {});
                        if (selectedItem == undefined)
                            cancelled = true;
                        else {
                            const alObjectItem = ALObjectItem.convertToALObjectItem(selectedItem);
                            alObject = this.alObjects.find(element =>
                                element.type == "tableextension"
                                && element.id == alObjectItem.id
                                && element.appPackageName == alObjectItem.appPackageName
                            );
                        }
                    }
                }
                longType = "TableExtension";
                break;
            case "ted":
                alObject = tempAlObjects.find(element => element.type == "tableextension");
                longType = "TableExtension";
                break;
            case "pe":
                if (appPackageName == '') {
                    const results = this.alObjects.filter(element => element.extendsType == "page" && element.extendsID == id);
                    if (results.length <= 1)
                        alObject = results[0];
                    else {
                        // Show options for multiple AL Objects
                        var alObjectItems = []
                        results.forEach(element => {
                            alObjectItems.push(new ALObjectItem(element));
                        });
                        const selectedItem = await vscode.window.showQuickPick(alObjectItems, {});
                        if (selectedItem == undefined)
                            cancelled = true;
                        else {
                            const alObjectItem = ALObjectItem.convertToALObjectItem(selectedItem);
                            alObject = this.alObjects.find(element =>
                                element.type == "pageextension"
                                && element.id == alObjectItem.id
                                && element.appPackageName == alObjectItem.appPackageName
                            );
                        }
                    }
                }
                longType = "PageExtension";
                break;
            case "ped":
                alObject = tempAlObjects.find(element => element.type == "pageextension");
                longType = "PageExtension";
                break;
            case "ee":
                if (appPackageName == '') {
                    const results = this.alObjects.filter(element => element.extendsType == "enum" && element.extendsID == id);
                    if (results.length <= 1)
                        alObject = results[0];
                    else {
                        // Show options for multiple AL Objects
                        var alObjectItems = []
                        results.forEach(element => {
                            alObjectItems.push(new ALObjectItem(element));
                        });
                        const selectedItem = await vscode.window.showQuickPick(alObjectItems, {});
                        if (selectedItem == undefined)
                            cancelled = true;
                        else {
                            const alObjectItem = ALObjectItem.convertToALObjectItem(selectedItem);
                            alObject = this.alObjects.find(element =>
                                element.type == "enumextension"
                                && element.id == alObjectItem.id
                                && element.appPackageName == alObjectItem.appPackageName
                            );
                        }
                    }
                }
                longType = "EnumExtension";
                break;
            case "eed":
                alObject = tempAlObjects.find(element => element.type == "enumextension");
                longType = "EnumExtension";
                break;
        }
        if (cancelled)
            return;

        if (alObject == undefined) {
            vscode.window.showWarningMessage("No Object found with Type " + longType + " and ID " + id);
            return;
        }

        this.outputChannel.appendLine("Found Object: " + alObject.id + " " + alObject.name);

        vscode.workspace.openTextDocument(alObject.path).then(doc => {
            vscode.window.showTextDocument(doc);
            vscode.window.showInformationMessage(longType + " " + id + " opened");
        }, function (reason) {
            this.outputChannel.appendLine("Rejected: " + reason);
        });
    }


    hasNumber(myString) {
        return /\d/.test(myString);
    }

    hasLetter(myString) {
        return /[a-zA-Z]/.test(myString);
    }

    getALObject(firstLine, pathToFile) {
        var startIndex = 0;
        var endIndex = firstLine.indexOf(' ');
        var type = firstLine.substring(startIndex, endIndex);
        if (type == '')
            return undefined;
        startIndex = endIndex + 1;
        endIndex = firstLine.indexOf(' ', startIndex);
        var id = firstLine.substring(startIndex, endIndex);
        if (id == '' || !this.hasNumber(id))
            return undefined;
        startIndex = endIndex + 1;
        endIndex = firstLine.indexOf(' ', startIndex);
        if (firstLine[startIndex] == '"') {
            startIndex += 1;
            endIndex = firstLine.indexOf('"', startIndex);
        }
        var name = "";
        if (endIndex == -1)
            name = firstLine.substring(startIndex)
        else
            name = firstLine.substring(startIndex, endIndex);

        if (name == '')
            return undefined;

        if (type.endsWith("extension")) {
            startIndex = firstLine.indexOf("extends ") + "extends ".length;
            var extendsName = firstLine.substring(startIndex);
            extendsName = extendsName.trim();
            if (extendsName.startsWith("\""))
                extendsName = extendsName.substring(1, extendsName.length - 1);
            return new ALObject(pathToFile, type.toLowerCase(), id, name, extendsName);
        }

        return new ALObject(pathToFile, type.toLowerCase(), id, name, '');
    }

    findExtendsID(alObject) {
        if (!alObject.extension)
            return alObject;

        var extendsObject = this.alObjects.find(element => element.type == alObject.extendsType && element.name == alObject.extendsName);
        if (extendsObject == undefined)
            return alObject;

        alObject.setExtendObject(extendsObject.id, extendsObject.type);
        return alObject;
    }

    log(message) {
        const prefix = "AL Object Helper: ";
        console.log(prefix + message);
    }

    output(message) {
        this.outputChannel.appendLine(message);
    }
}