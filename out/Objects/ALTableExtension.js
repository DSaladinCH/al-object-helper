"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALTableExtension = void 0;
const internal_1 = require("../internal");
const ObjectType_1 = require("../ObjectType");
class ALTableExtension extends internal_1.ALExtension {
    constructor(objectPath, appPackage, objectType, objectID, objectName) {
        super(objectPath, appPackage, objectType, objectID, objectName);
        this.fields = [];
    }
    setTempParentObjectFromType(objectName) {
        this.parent = new internal_1.ALTable('', this.appPackage, ObjectType_1.ObjectType.Table, '', objectName);
    }
}
exports.ALTableExtension = ALTableExtension;
//# sourceMappingURL=ALTableExtension.js.map