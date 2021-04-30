"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALQuery = void 0;
const internal_1 = require("../../internal");
class ALQuery extends internal_1.ALObject {
    constructor(objectPath, objectID, objectName, alApp) {
        super(objectPath, internal_1.ObjectType.Query, objectID, objectName, alApp);
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
exports.ALQuery = ALQuery;
//# sourceMappingURL=ALQuery.js.map