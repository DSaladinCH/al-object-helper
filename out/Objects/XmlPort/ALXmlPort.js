"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALXmlport = void 0;
const internal_1 = require("../../internal");
class ALXmlport extends internal_1.ALObject {
    constructor(objectPath, objectID, objectName, alApp) {
        super(objectPath, internal_1.ObjectType.Xmlport, objectID, objectName, alApp);
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
exports.ALXmlport = ALXmlport;
//# sourceMappingURL=ALXmlport.js.map