"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALCodeunit = void 0;
const internal_1 = require("../../internal");
class ALCodeunit extends internal_1.ALObject {
    constructor(objectPath, objectID, objectName, alApp) {
        super(objectPath, internal_1.ObjectType.Codeunit, objectID, objectName, alApp);
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
exports.ALCodeunit = ALCodeunit;
//# sourceMappingURL=ALCodeunit.js.map