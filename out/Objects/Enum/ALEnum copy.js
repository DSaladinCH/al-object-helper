"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALEnum = void 0;
const internal_1 = require("../../internal");
class ALEnum extends internal_1.ALObject {
    constructor(objectPath, appPackage, objectType, objectID, objectName) {
        super(objectPath, appPackage, objectType, objectID, objectName);
        this.fields = [];
    }
}
exports.ALEnum = ALEnum;
//# sourceMappingURL=ALEnum copy.js.map