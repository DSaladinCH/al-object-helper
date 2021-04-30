"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALReport = void 0;
const internal_1 = require("../../internal");
class ALReport extends internal_1.ALObject {
    constructor(objectPath, objectID, objectName, alApp) {
        super(objectPath, internal_1.ObjectType.Report, objectID, objectName, alApp);
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
exports.ALReport = ALReport;
//# sourceMappingURL=ALReport.js.map