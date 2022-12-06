import * as vscode from "vscode";
import { ALFunctionItem } from "./internal";

export class QuickPickManagement<T> {
    quickPick: vscode.QuickPick<vscode.QuickPickItem>;

    constructor() {
        this.quickPick = vscode.window.createQuickPick();
    }

    async create(placeholderText: string, items?: vscode.QuickPickItem[]): Promise<T | undefined> {
        return new Promise<T | undefined>((resolve) => {
            this.quickPick = vscode.window.createQuickPick();
            this.quickPick.placeholder = placeholderText;

            if (!items) {
                this.quickPick.busy = true;
            }
            else {
                this.quickPick.items = items;
            }

            this.quickPick.matchOnDescription = true;
            this.quickPick.matchOnDetail = true;
            let accepted = false;

            this.quickPick.onDidAccept(() => {
                accepted = true;
                this.quickPick.hide();
            });

            this.quickPick.onDidHide(() => {
                if (this.quickPick.selectedItems.length === 0 || !accepted) {
                    resolve(undefined);
                    return undefined;
                }
                else {
                    resolve((this.quickPick.selectedItems[0] as unknown) as T);
                    return (this.quickPick.selectedItems[0] as unknown) as T;
                }
            });

            this.quickPick.show();
        });
    }

    updateValue(items: vscode.QuickPickItem[]) {
        this.quickPick.items = items;
        this.quickPick.busy = false;
    }
}