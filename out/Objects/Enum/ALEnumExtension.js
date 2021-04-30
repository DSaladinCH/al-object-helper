"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALEnumExtension = void 0;
const internal_1 = require("../../internal");
class ALEnumExtension extends internal_1.ALExtension {
    constructor(objectPath, objectID, objectName, alApp) {
        super(objectPath, internal_1.ObjectType.EnumExtension, objectID, objectName, alApp);
        this.fields = [];
    }
    setTempParentObjectFromType(objectName) {
        this.parent = new internal_1.ALEnum('', '', objectName, internal_1.ALApp.Empty());
    }
    getUIDescription() {
        let description = `${internal_1.ObjectType[this.objectType]} ${this.objectID}`;
        if (this.parent === undefined) {
            return " - Extends unknown";
        }
        if (this.parent.objectID === "") {
            description += ` - Extends "${this.parent.objectName}"`;
        }
        else {
            description += ` - Extends ${this.parent.objectType} ${this.parent.objectID} - ${this.parent.objectName}`;
        }
        return description;
    }
    getUIDetail() {
        if (!this.alApp) {
            return "";
        }
        return `${this.alApp.appPublisher} - ${this.alApp.appName}`;
    }
    addLocalEvents() {
    }
}
exports.ALEnumExtension = ALEnumExtension;
//# sourceMappingURL=ALEnumExtension.js.map