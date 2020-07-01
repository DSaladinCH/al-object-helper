const vscode = require('vscode');
const { workspace } = require("vscode");
const path = require("path");
const fs = require('fs');
const JSZip = require('jszip');
const firstLine = require('firstline');
const os = require('os');
const readline = require('readline');
const ALObjectItem = require('./ALObjectItem');
const AppPackage = require('./AppPackage');
const ALObject = require('./ALObject');
const { file } = require('jszip');

module.exports = class Reader {
    constructor() {
        this.alObjects = [];
        this.appPackages = [];
        this.appPackages.push(new AppPackage('Custom'));
        this.readLocalFiles = false;
        this.outputChannel = vscode.window.createOutputChannel("ALObjectHelper");
    }

    generateAll(checkExists) {
        const rootPath = workspace.rootPath;
        const alCachePath = rootPath.replace(/\\/g, '/') + '/.vscode/.alcache';
        const baseAppFolderPath = path.join(os.tmpdir(), 'VSCode', path.basename(rootPath), 'ALObjectHelper').replace(/\\/g, '/');
        const reader = this;
        console.log(path.join(os.tmpdir(), 'VSCode', path.basename(rootPath), 'ALObjectHelper'));
        this.readLocalFiles = false;
        this.alObjects = [];
        this.appPackages = [];
        this.appPackages.push(new AppPackage('Custom'));

        if (!fs.existsSync(baseAppFolderPath))
            fs.mkdirSync(baseAppFolderPath, { recursive: true });

        fs.readdir(baseAppFolderPath, async function (error, files) {
            if (error)
                reader.outputChannel.appendLine(error.message);
            if (checkExists && files != undefined && files.length > 0) {
                //reader.appPackages.push(new AppPackage('Custom'));
                files.forEach(element => {
                    const appPackageName = path.basename(element);
                    reader.appPackages.push(new AppPackage(appPackageName.split('_')[0] + "_" + appPackageName.split('_')[1]));
                });

                reader.detectCustomAlFiles();
                files.forEach(element => {
                    reader.detectAllAlFiles(path.basename(element));
                });
            }
            else {
                if (checkExists) {
                    if (files == undefined || files.length <= 0) {
                        await reader.detectCustomAlFiles();
                        await reader.readFiles();
                    }
                    else {
                        if (files != undefined && files.length > 0) {
                            fs.unlink(baseAppFolderPath, async function (error) {
                                if (error)
                                    this.outputChannel.appendLine(error);
                                await reader.detectCustomAlFiles();
                                await reader.readFiles();
                            });
                        }
                        else {
                            await reader.detectCustomAlFiles();
                            await reader.readFiles();
                        }
                    }
                }
                else {
                    fs.unlink(baseAppFolderPath, async function (error) {
                        if (error)
                            this.outputChannel.appendLine(error);
                        await reader.detectCustomAlFiles();
                        await reader.readFiles();
                    });
                }
            }
        });
    }

    async readFiles() {
        const rootPath = workspace.rootPath;
        const alPackagesPath = rootPath + "\\.alpackages";
        const alCachePath = rootPath.replace(/\\/g, '/') + '/.vscode/.alcache';
        // const baseAppZipPath = alCachePath + '/BaseApp.zip';
        // const baseApp2ZipPath = alCachePath + '/BaseApp2.zip';
        const baseAppFolderPath = path.join(os.tmpdir(), 'VSCode', path.basename(rootPath), 'ALObjectHelper').replace(/\\/g, '/');
        const appFilter = '.app';
        const reader = this;

        var appFiles = await reader.readDir(alPackagesPath, appFilter, this);
        var appPackages = [];

        var appFiles2 = [];
        appFiles.forEach(element => {
            var splittedName = path.basename(element).split('_');
            if (appPackages.indexOf(splittedName[0] + "_" + splittedName[1]) != -1)
                return;

            appPackages.push(splittedName[0] + "_" + splittedName[1]);
            this.appPackages.push(new AppPackage(splittedName[0] + "_" + splittedName[1]));
            appFiles2.push(element);
        });
        appFiles = appFiles2;

        appFiles.forEach(async element => {
            var splittedName = path.basename(element).split('_');
            // if (appPackages.indexOf(splittedName[0] + "_" + splittedName[1]) != -1)
            //     return;

            fs.copyFile(element, alCachePath + '/' + splittedName[0] + "_" + splittedName[1] + '.zip', async (error) => {
                if (error)
                    this.outputChannel.appendLine(error.message);
                console.log('Copied App File to AL Cache');
                try {
                    fs.readFile(alCachePath + '/' + splittedName[0] + "_" + splittedName[1] + '.zip', function (error, data) {
                        if (error)
                            this.outputChannel.appendLine(error);
                        var start = Date.now();
                        JSZip.loadAsync(data, { createFolders: true }).then(function (zip) {
                            fs.unlinkSync(alCachePath + '/' + splittedName[0] + "_" + splittedName[1] + '.zip');
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
                            console.log((Date.now() - start) + " - Generating Buffer " + splittedName[0] + "_" + splittedName[1]);
                            start = Date.now();
                            vscode.window.showInformationMessage("Extracting App File");
                            zip
                                .generateNodeStream({ type: 'nodebuffer', streamFiles: false })
                                .pipe(fs.createWriteStream(alCachePath + '/' + splittedName[0] + "_" + splittedName[1] + '2.zip'))
                                .on('close', async function () {
                                    console.log((Date.now() - start) + " - Generated Buffer " + splittedName[0] + "_" + splittedName[1]);
                                    start = Date.now();
                                    var AdmZip = require('adm-zip');
                                    var admZip = new AdmZip(alCachePath + '/' + splittedName[0] + "_" + splittedName[1] + '2.zip');
                                    fs.exists(baseAppFolderPath + '/' + splittedName[0] + "_" + splittedName[1], async function (exists) {
                                        if (!exists) {
                                            fs.mkdir(baseAppFolderPath + '/' + splittedName[0] + "_" + splittedName[1], async function (error) {
                                                if (error)
                                                    reader.outputChannel.appendLine(error.message);
                                                console.log((Date.now() - start) + " - Unzipping File " + splittedName[0] + "_" + splittedName[1]);
                                                start = Date.now();
                                                admZip.extractAllTo(baseAppFolderPath + '/' + splittedName[0] + "_" + splittedName[1], true);
                                                fs.unlinkSync(alCachePath + '/' + splittedName[0] + "_" + splittedName[1] + '2.zip');
                                                //vscode.window.showInformationMessage("Extracted App File");
                                                console.log((Date.now() - start) + " - Extracted App File");

                                                const packageName = splittedName[0] + "_" + splittedName[1];
                                                if (reader.appPackages.find(element => element.packageName == packageName) == undefined)
                                                    reader.appPackages.push(new AppPackage(packageName));
                                                await reader.detectAllAlFiles(splittedName[0] + "_" + splittedName[1]);
                                            });
                                        }
                                        else {
                                            console.log((Date.now() - start) + " - Unzipping File " + splittedName[0] + "_" + splittedName[1]);
                                            start = Date.now();
                                            admZip.extractAllTo(baseAppFolderPath + '/' + splittedName[0] + "_" + splittedName[1], true);
                                            fs.unlinkSync(alCachePath + '/' + splittedName[0] + "_" + splittedName[1] + '2.zip');
                                            //vscode.window.showInformationMessage("Extracted App File");
                                            console.log((Date.now() - start) + " - Extracted App File");

                                            const packageName = splittedName[0] + "_" + splittedName[1];
                                            if (reader.appPackages.find(element => element.packageName == packageName) == undefined)
                                                reader.appPackages.push(new AppPackage(packageName));
                                            await reader.detectAllAlFiles(splittedName[0] + "_" + splittedName[1]);
                                        }
                                    });
                                });
                        });
                    });
                }
                catch (err) {
                    console.log(err);
                }
            });
        });
    }

    async detectCustomAlFiles() {
        const rootPath = workspace.rootPath;
        const alFilter = '.al';
        const packageName = 'Custom';

        var files = await this.readDir(rootPath, alFilter, this);
        console.log("Found " + files.length + " Custom AL Files");

        if (this.appPackages.find(element => element.packageName == packageName) == undefined)
            this.appPackages.push(new AppPackage(packageName));

        if (files.length == 0) {
            var foundIndex = this.appPackages.findIndex(a => a.packageName == packageName);
            this.appPackages[foundIndex].processed = true;
        }

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
                //alObject.path = path.relative(workspace.rootPath, alObject.path);
                this.alObjects.push(alObject);
            }

            i++;
            if (i >= arrLen - 1) {
                vscode.window.showInformationMessage("AL Object Helper: Found " + arrLen + " Custom AL Files");

                this.detectAllExtensions();
                var foundIndex = this.appPackages.findIndex(a => a.packageName == packageName);
                this.appPackages[foundIndex].processed = true;
                if (this.allPackagesFinished()) {
                    vscode.window.showInformationMessage("AL Object Helper: Read out all AL files!");
                    console.log('Read all!');
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
            }
        });
    }

    async detectAllAlFiles(appPackageName) {
        const rootPath = workspace.rootPath;
        const baseAppFolderPath = path.join(os.tmpdir(), 'VSCode', path.basename(rootPath), 'ALObjectHelper', appPackageName).replace(/\\/g, '/');
        const alFilter = '.al';
        const packageName = appPackageName.split('_')[0] + "_" + appPackageName.split('_')[1];

        var files2 = await this.readDir(baseAppFolderPath, alFilter, this);
        console.log("Found " + files2.length + " AL Files of " + appPackageName.split('_')[1]);
        var arrLen2 = files2.length;
        var i2 = 0;

        if (this.appPackages.find(element => element.packageName == packageName) == undefined)
            this.appPackages.push(new AppPackage(packageName));

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
            if (i2 >= arrLen2 - 1) {
                this.detectAllExtensions();
                var foundIndex = this.appPackages.findIndex(a => a.packageName == packageName);
                this.appPackages[foundIndex].processed = true;
                if (this.allPackagesFinished()) {
                    vscode.window.showInformationMessage("AL Object Helper: Read out all AL files!");
                    console.log('Read all!');
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
            }
        });
    }

    async detectAllRDLCFiles() {
        const rootPath = workspace.rootPath;
        const baseAppFolderPath = path.join(os.tmpdir(), 'VSCode', path.basename(rootPath), 'ALObjectHelper').replace(/\\/g, '/');
        const alFilter = '.al';

        var files = await this.readDir(rootPath, alFilter, this);
        console.log("Found " + files.length + " Custom AL Files");

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
                    console.log("no dir ", startPath);
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
}