"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALExtension = void 0;
const internal_1 = require("../internal");
class ALExtension extends internal_1.ALObject {
    constructor(objectPath, objectType, objectID, objectName, alApp) {
        super(objectPath, objectType, objectID, objectName, alApp);
        this.parent = undefined;
    }
    static getParentObjectFromType(objectType, objectPath, objectID, objectName, alApp) {
        switch (objectType) {
            case internal_1.ObjectType.TableExtension:
                return new internal_1.ALTable(objectPath, objectID, objectName, alApp);
            case internal_1.ObjectType.PageExtension:
                return new internal_1.ALPage(objectPath, objectID, objectName, alApp);
            case internal_1.ObjectType.ReportExtension:
                return new internal_1.ALReport(objectPath, objectID, objectName, alApp);
            case internal_1.ObjectType.EnumExtension:
                return new internal_1.ALEnum(objectPath, objectID, objectName, alApp);
            default:
                return undefined;
        }
    }
}
exports.ALExtension = ALExtension;
//# sourceMappingURL=ALExtension.js.map