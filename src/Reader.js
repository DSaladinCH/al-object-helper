const vscode = require('vscode');
const { workspace } = require("vscode");
const path = require("path");
const fs = require('fs');
const readline = require('readline');
const JSZip = require('jszip');
const { resolve } = require('path');
const firstLine = require('firstline');
const os = require('os');

module.exports = class Reader {
    constructor() {
        this.alObjects = [];
    }

    generateAll(checkExists) {
        const rootPath = workspace.rootPath;
        const alCachePath = rootPath.replace(/\\/g, '/') + '/.vscode/.alcache';
        const baseAppFolderPath = path.join(os.tmpdir(), 'VSCode', path.basename(rootPath), 'BaseApp').replace(/\\/g, '/');
        const reader = this;

        fs.readdir(baseAppFolderPath, async function (error, files) {
            if (checkExists && files != undefined && files.length > 0) {
                await reader.detectAllAlFiles();
            }
            else {
                if (checkExists) {
                    if (files == undefined || files.length <= 0) {
                        await reader.readFiles();
                    }
                    else {
                        if (files != undefined && files.length > 0) {
                            fs.unlink(baseAppFolderPath, async function (error) {
                                await reader.readFiles();
                            });
                        }
                        else {
                            await reader.readFiles();
                        }
                    }
                }
                else{
                    fs.unlink(baseAppFolderPath, async function (error) {
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
        const baseAppZipPath = alCachePath + '/BaseApp.zip';
        const baseApp2ZipPath = alCachePath + '/BaseApp2.zip';
        const baseAppFolderPath = path.join(os.tmpdir(), 'VSCode', path.basename(rootPath), 'BaseApp').replace(/\\/g, '/');
        const appFilter = '.app';
        const reader = this;

        var appFiles = await reader.readDir(alPackagesPath, appFilter, this);
        appFiles = [appFiles[0]];
        appFiles.forEach(async element => {
            var splittedName = path.basename(element).split('_');
            if (splittedName[0] != "Microsoft" || splittedName[1] != "Base Application")
                return;

            fs.copyFile(element, baseAppZipPath, async (err) => {
                if (err) throw err;
                console.log('Copied App File to AL Cache');
                try {
                    fs.readFile(baseAppZipPath, function (error, data) {
                        if (err) {
                            throw err;
                        }

                        JSZip.loadAsync(data).then(function (zip) {
                            fs.unlinkSync(baseAppZipPath);
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
                            console.log("Generating Buffer");
                            vscode.window.showInformationMessage("Extracting App File");
                            zip
                                .generateNodeStream({ type: 'nodebuffer', streamFiles: false })
                                .pipe(fs.createWriteStream(baseApp2ZipPath))
                                .on('close', async function () {
                                    console.log("Unzipping File");
                                    var AdmZip = require('adm-zip');
                                    var admZip = new AdmZip(baseApp2ZipPath);
                                    fs.exists(baseAppFolderPath, async function (exists) {
                                        if (!exists) {

                                            fs.mkdir(baseAppFolderPath, async function (error) {
                                                admZip.extractAllTo(baseAppFolderPath, true);
                                                fs.unlinkSync(baseApp2ZipPath);
                                                vscode.window.showInformationMessage("Extracted App File");

                                                await reader.detectAllAlFiles();
                                            });
                                        }
                                        else {
                                            admZip.extractAllTo(baseAppFolderPath, true);
                                            fs.unlinkSync(baseApp2ZipPath);
                                            vscode.window.showInformationMessage("Extracted App File");

                                            await reader.detectAllAlFiles();
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

    async detectAllAlFiles() {
        const rootPath = workspace.rootPath;
        const baseAppFolderPath = path.join(os.tmpdir(), 'VSCode', path.basename(rootPath), 'BaseApp').replace(/\\/g, '/');
        const alFilter = '.al';

        var files = await this.readDir(rootPath, alFilter, this);
        console.log("Found " + files.length + " Custom AL Files");

        var arrLen = files.length;
        var i = 0;
        files.forEach(async element => {
            var line = await firstLine(element);
            var aLObject = this.getALObject(line, element);
            this.alObjects.push(aLObject);
            i++;
            if (i === arrLen - 1) {
                vscode.window.showInformationMessage("Found " + arrLen + " Custom AL Files");

                this.detectAllExtensions();
            }
        });

        var files2 = await this.readDir(baseAppFolderPath, alFilter, this);
        console.log("Found " + files2.length + " Standard AL Files");
        var arrLen2 = files2.length;
        var i2 = 0;
        files2.forEach(async element => {
            var line = await firstLine(element);
            var aLObject = this.getALObject(line, element);
            this.alObjects.push(aLObject);
            i2++;
            if (i2 === arrLen2 - 1) {
                vscode.window.showInformationMessage("Found " + arrLen2 + " Standard AL Files");

                this.detectAllExtensions();
            }
        });
    }

    detectAllExtensions() {
        var arrLen = this.alObjects.length;
        var i = 0;
        this.alObjects.forEach(element => {
            element.extendsID = this.findExtendsID(element, this.alObjects).extendsID;
            i++;
            if (i === arrLen - 1) {
                console.log("All Objects linked");
                vscode.window.showInformationMessage("Linked all Extensions to Standard Objects");
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

    openFile(input) {
        if (input === '')
            return;

        input = input.toLowerCase();
        var longType = "";
        var type = input.substring(0, 2);
        var id = input.substring(2);
        if (this.hasNumber(type)) {
            type = type.substring(0, 1);
            id = input.substring(1);
        }
        var alObject;
        var filePath = "";

        switch (type) {
            case "t":
                alObject = this.alObjects.find(element => element.type == "table" && element.id == id);
                longType = "Table";
                break;
            case "p":
                alObject = this.alObjects.find(element => element.type == "page" && element.id == id);
                longType = "Page";
                break;
            case "c":
                alObject = this.alObjects.find(element => element.type == "codeunit" && element.id == id);
                longType = "Codeunit";
                break;
            case "r":
                alObject = this.alObjects.find(element => element.type == "report" && element.id == id);
                longType = "Report";
                break;
            case "x":
                alObject = this.alObjects.find(element => element.type == "xmlport" && element.id == id);
                longType = "XmlPort";
                break;
            case "e":
                alObject = this.alObjects.find(element => element.type == "enum" && element.id == id);
                longType = "Enum";
                break;
            case "te":
                alObject = this.alObjects.find(element => element.extendsType == "table" && element.extendsID == id);
                longType = "TableExtension";
                break;
            case "pe":
                alObject = this.alObjects.find(element => element.extendsType == "page" && element.extendsID == id);
                longType = "PageExtension";
                break;
            case "ee":
                alObject = this.alObjects.find(element => element.extendsType == "enum" && element.extendsID == id);
                longType = "EnumExtension";
                break;
        }
        if (alObject == undefined) {
            vscode.window.showInformationMessage("No Object found with Type " + longType + " and ID " + id);
            return;
        }

        var openPath = vscode.Uri.parse("file:///" + alObject.path); //A request file path
        vscode.workspace.openTextDocument(openPath).then(doc => {
            vscode.window.showTextDocument(doc);
            vscode.window.showInformationMessage(longType + " " + id + " opened");
        });
    }

    hasNumber(myString) {
        return /\d/.test(myString);
    }

    getALObject(firstLine, pathToFile) {
        var startIndex = 0;
        var endIndex = firstLine.indexOf(' ');
        var type = firstLine.substring(startIndex, endIndex);
        startIndex = endIndex + 1;
        endIndex = firstLine.indexOf(' ', startIndex);
        var id = firstLine.substring(startIndex, endIndex);
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

        if (type.endsWith("extension")) {
            startIndex = firstLine.indexOf("extends ") + "extends ".length;
            var extendsName = firstLine.substring(startIndex);
            if (extendsName.startsWith("\""))
                extendsName = extendsName.substring(1, extendsName.length - 2);
            return new ALObject(pathToFile, type.toLowerCase(), id, name, extendsName);
        }

        return new ALObject(pathToFile, type.toLowerCase(), id, name, '');
    }

    findExtendsID(alObject, alObjects) {
        if (!alObject.extension)
            return alObject;

        var extendsObject = alObjects.find(element => element.type == alObject.extendsType && element.name == alObject.extendsName);
        if (extendsObject == undefined)
            return alObject;

        alObject.extendsID = extendsObject.id;
        return alObject;
    }
}

class ALObject {
    constructor(path, type, id, name, extendsName) {
        this.path = path;
        this.type = type.trim();
        this.id = id;
        this.name = name.trim();
        this.extendsName = extendsName.trim();
        this.extendsID = -1;
        this.extendsType = "";

        if (this.extendsName == '')
            this.extension = false;
        else {
            this.extension = true;
            this.extendsType = this.type.substring(0, this.type.indexOf("extension")).trim();
        }
    }
}