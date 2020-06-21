const vscode = require('vscode');
const { workspace } = require("vscode");
const path = require("path");

function ReadAppFile() {
    const fpaths = (workspace).workspaceFolders;

    fpaths.forEach(wkspace => {
        const fpath = path.join(wkspace.uri.fsPath, '.alpackages', path.sep);
    });
}

function readDir(filePath) {

}

function openFile(input) {
    vscode.window.showInformationMessage('This would open ' + input);
}