import { ALApp, ALObject, ALTable } from "../internal";

export class ALObjectItem {
    label: string;
    description: string = "";
    detail: string = "";
    alObject: ALObject;
    isTemporary: boolean = false;

    constructor(alObject: ALObject, onlyLabel: boolean = false) {
        this.label = alObject.objectName;
        if (!onlyLabel) {
            this.description = alObject.getUIDescription();
            this.detail = alObject.getUIDetail();
        }
        this.alObject = alObject;
    }

    static createShortcutItem(text: string): ALObjectItem {
        const item = new ALObjectItem(new ALTable("", "", text, ALApp.Empty()), true);
        item.isTemporary = true;
        return item;
    }
}