const vscode = require('vscode');
const { workspace } = require("vscode");
const path = require("path");
const fs = require('fs');
const readline = require('readline');
const { start } = require('repl');
const StreamZip = require('node-stream-zip');
var zip = new StreamZip({
    file: 'archive.zip',
    storeEntries: true
});

// function ReadAppFile() {
//     const fpaths = (workspace).workspaceFolders;

//     fpaths.forEach(wkspace => {
//         const fpath = path.join(wkspace.uri.fsPath, '.alpackages', path.sep);
//     });
// }

// function readDir(filePath) {

// }
module.exports = class Reader {
    constructor() {
        this.alObjects = [];
    }

    readAllFiles() {
        const rootPath = workspace.rootPath;
        const alFilter = '.al';
        const appFilter = '.app';

        var files = this.readDir(rootPath, alFilter);
        //this.alObjects = new ALObject[files.length];
        files.forEach(async element => {
            var line = await this.getFirstLine(element);
            var aLObject = this.getALObject(line, element);
            this.alObjects.push(aLObject);
            //console.log(aLObject.type + " " + aLObject.id);
            //console.log(element);
        });
        //console.log("Found " + files.length + " AL Files");

        var appFiles = this.readDir(rootPath + "\\.alpackages", appFilter);
        // var appFiles = this.readDir(rootPath, appFilter);
        appFiles = [appFiles[0]];
        appFiles.forEach(async element => {
            // destination.txt will be created or overwritten by default.

            var splittedName = path.basename(element).split('_');
            if (splittedName[0] != "Microsoft" || splittedName[1] != "Base Application")
                return;

            // fs.createReadStream(element).pipe(fs.createWriteStream(rootPath + '\\.vscode\\.alcache\\BaseApp.zip'));
            fs.copyFile(element, rootPath + '\\.vscode\\.alcache\\BaseApp.zip', async (err) => {
                if (err) throw err;
                console.log('Generated BaseApp.zip');
                try {
                    // zip = new StreamZip({
                    //     //file: rootPath + '\\.vscode\\.alcache\\BaseApp.zip',
                    //     file: element,
                    //     storeEntries: true
                    // });
                    // zip.on('error', (error) => {
                    //     console.log(error);
                    // });
                    // zip.on('ready', () => {
                    //     console.log('Entries read: ' + zip.entriesCount);
                    //     for (const entry of Object.values(zip.entries())) {
                    //         const desc = entry.isDirectory ? 'directory' : `${entry.size} bytes`;
                    //         console.log(`Entry ${entry.name}: ${desc}`);
                    //     }
                    //     // Do not forget to close the file once you're done
                    //     console.log('Extraction completed');
                    //     zip.close()
                    // });
                    
                    console.log('Extraction complete');
                }
                catch (err) {

                }
            });
        });
    }

    readDir(startPath, filter) {
        if (!fs.existsSync(startPath)) {
            console.log("no dir ", startPath);
            return;
        }

        var length = 0;
        var alFiles = [];
        var files = fs.readdirSync(startPath);
        for (var i = 0; i < files.length; i++) {
            var filename = path.join(startPath, files[i]);
            var stat = fs.lstatSync(filename);
            if (stat.isDirectory()) {
                var newALFiles = this.readDir(filename, filter); //recurse
                alFiles = alFiles.concat(newALFiles);
            }
            else if (filename.endsWith(filter)) {
                //console.log('-- found: ',filename);
                alFiles.push(filename);
                length += 1;
            };
        };

        return alFiles;
    }

    openFile(input) {
        var objects = this.readAllFiles();
        input = input.toLowerCase();
        var type = input.substring(0, 2);
        var id = input.substring(2);
        if (this.hasNumber(type)) {
            type = type.substring(0, 1);
            id = input.substring(1);
        }
        var filePath = "";
        switch (type) {
            case "t":
                filePath = this.alObjects.find(element => element.type == "table" && element.id == id).path;
                break;
            case "p":
                filePath = this.alObjects.find(element => element.type == "page" && element.id == id).path;
                break;
            case "c":
                filePath = this.alObjects.find(element => element.type == "codeunit" && element.id == id).path;
                break;
            case "r":
                filePath = this.alObjects.find(element => element.type == "report" && element.id == id).path;
                break;
            case "x":
                filePath = this.alObjects.find(element => element.type == "xmlport" && element.id == id).path;
                break;
            case "e":
                filePath = this.alObjects.find(element => element.type == "enum" && element.id == id).path;
                break;
        }

        if (filePath != "") {
            var openPath = vscode.Uri.parse("file:///" + filePath); //A request file path
            vscode.workspace.openTextDocument(openPath).then(doc => {
                vscode.window.showTextDocument(doc);
            });
        }
        vscode.window.showInformationMessage('This would open ' + input);
    }

    hasNumber(myString) {
        return /\d/.test(myString);
    }

    async getFirstLine(pathToFile) {
        const readable = fs.createReadStream(pathToFile);
        const reader = readline.createInterface({ input: readable });
        const line = await new Promise((resolve) => {
            reader.on('line', (line) => {
                reader.close();
                resolve(line);
            });
        });
        readable.close();
        return line;
    }

    getALObject(firstLine, pathToFile) {
        var startIndex = 0;
        var endIndex = firstLine.indexOf(' ');
        var type = firstLine.substring(startIndex, endIndex);
        startIndex = endIndex + 1;
        endIndex = firstLine.indexOf(' ', startIndex);
        var id = firstLine.substring(startIndex, endIndex);
        return new ALObject(pathToFile, type.toLowerCase(), id, '');
    }
}

class ALObject {
    constructor(path, type, id, name) {
        this.path = path;
        this.type = type;
        this.id = id;
        this.name = name;
    }
}