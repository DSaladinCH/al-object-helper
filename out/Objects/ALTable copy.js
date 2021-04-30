"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALTable = void 0;
const internal_1 = require("../internal");
class ALTable extends internal_1.ALObject {
    constructor(objectPath, appPackage, objectType, objectID, objectName) {
        super(objectPath, appPackage, objectType, objectID, objectName);
        this.fields = [];
    }
}
exports.ALTable = ALTable;
//# sourceMappingURL=ALTable copy.js.map