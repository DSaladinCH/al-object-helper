// Credits: https://github.com/auchenberg/vscode-browser-preview/blob/master/ext-src/targetTreeProvider.ts

import * as vscode from "vscode";

export class ALObjectHelperTreeDataProvider implements vscode.TreeDataProvider<object> {
    private _onDidChangeTreeData: vscode.EventEmitter<object | undefined> = new vscode.EventEmitter<object | undefined>();
    readonly onDidChangeTreeData: vscode.Event<object | undefined> = this._onDidChangeTreeData.event;

    constructor() { }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: object): vscode.TreeItem {
        return element;
    }

    getChildren(element?: object): Thenable<object[]> {
        vscode.commands.executeCommand("al-object-helper.openALObjectList");
        vscode.commands.executeCommand("workbench.view.explorer");

        // Make sure collection is not cached
        this._onDidChangeTreeData.fire(undefined);
        return Promise.reject([]);
    }
}