"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALObjectItem = void 0;
const internal_1 = require("../internal");
class ALObjectItem {
    constructor(alObject, onlyLabel = false) {
        this.description = "";
        this.detail = "";
        this.isTemporary = false;
        this.label = alObject.objectName;
        if (!onlyLabel) {
            this.description = alObject.getUIDescription();
            this.detail = alObject.getUIDetail();
        }
        this.alObject = alObject;
    }
    static createShortcutItem(text) {
        const item = new ALObjectItem(new internal_1.ALTable("", "", text, internal_1.ALApp.Empty()), true);
        item.isTemporary = true;
        return item;
    }
}
exports.ALObjectItem = ALObjectItem;
//# sourceMappingURL=ALObjectItem.js.map