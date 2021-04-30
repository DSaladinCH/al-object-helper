"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALEnum = void 0;
const internal_1 = require("../../internal");
class ALEnum extends internal_1.ALObject {
    constructor(objectPath, objectID, objectName, alApp) {
        super(objectPath, internal_1.ObjectType.Enum, objectID, objectName, alApp);
        this.fields = [];
    }
    getUIDescription() {
        return `${internal_1.ObjectType[this.objectType]} ${this.objectID}`;
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
exports.ALEnum = ALEnum;
//# sourceMappingURL=ALEnum.js.map