"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALObject = void 0;
const internal_1 = require("../internal");
class ALObject {
    constructor(objectPath, objectType, objectID, objectName, alApp) {
        this.functions = [];
        this.variables = [];
        this.objectPath = objectPath;
        this.objectType = objectType;
        this.objectID = objectID;
        this.objectName = objectName;
        if (this.objectName.startsWith("\"")) {
            this.objectName = this.objectName.substring(1);
            this.objectName = this.objectName.substring(0, this.objectName.length - 1);
        }
        this.alApp = alApp;
    }
    static getObjectFromType(objectType, objectPath, objectID, objectName, alApp) {
        switch (objectType) {
            case internal_1.ObjectType.Table:
                return new internal_1.ALTable(objectPath, objectID, objectName, alApp);
            case internal_1.ObjectType.TableExtension:
                return new internal_1.ALTableExtension(objectPath, objectID, objectName, alApp);
            case internal_1.ObjectType.Page:
                return new internal_1.ALPage(objectPath, objectID, objectName, alApp);
            case internal_1.ObjectType.PageExtension:
                return new internal_1.ALPageExtension(objectPath, objectID, objectName, alApp);
            case internal_1.ObjectType.Codeunit:
                return new internal_1.ALCodeunit(objectPath, objectID, objectName, alApp);
            case internal_1.ObjectType.Xmlport:
                return new internal_1.ALXmlport(objectPath, objectID, objectName, alApp);
            case internal_1.ObjectType.Report:
                return new internal_1.ALReport(objectPath, objectID, objectName, alApp);
            case internal_1.ObjectType.ReportExtension:
                return new internal_1.ALReportExtension(objectPath, objectID, objectName, alApp);
            case internal_1.ObjectType.Query:
                return new internal_1.ALQuery(objectPath, objectID, objectName, alApp);
            case internal_1.ObjectType.Enum:
                return new internal_1.ALEnum(objectPath, objectID, objectName, alApp);
            case internal_1.ObjectType.EnumExtension:
                return new internal_1.ALEnumExtension(objectPath, objectID, objectName, alApp);
            default:
                return undefined;
        }
    }
    isExtension() {
        switch (this.objectType) {
            case internal_1.ObjectType.TableExtension:
            case internal_1.ObjectType.PageExtension:
            case internal_1.ObjectType.EnumExtension:
                return true;
            default:
                return false;
        }
    }
}
exports.ALObject = ALObject;
//# sourceMappingURL=ALObject.js.map