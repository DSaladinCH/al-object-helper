"use strict";
// Also edit "getObjectTypeFromString" in HelperFunctions, "getObjectFromType" in ALObject, "getParentObjectFromType" in ALExtension and "getEventSubscriberText" in ALFunction
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectType = void 0;
var ObjectType;
(function (ObjectType) {
    ObjectType[ObjectType["Table"] = 0] = "Table";
    ObjectType[ObjectType["TableExtension"] = 1] = "TableExtension";
    ObjectType[ObjectType["Page"] = 2] = "Page";
    ObjectType[ObjectType["PageExtension"] = 3] = "PageExtension";
    ObjectType[ObjectType["Codeunit"] = 4] = "Codeunit";
    ObjectType[ObjectType["Xmlport"] = 5] = "Xmlport";
    ObjectType[ObjectType["Report"] = 6] = "Report";
    ObjectType[ObjectType["ReportExtension"] = 7] = "ReportExtension";
    ObjectType[ObjectType["Query"] = 8] = "Query";
    ObjectType[ObjectType["Enum"] = 9] = "Enum";
    ObjectType[ObjectType["EnumExtension"] = 10] = "EnumExtension";
    ObjectType[ObjectType["NotAvailable"] = 11] = "NotAvailable";
})(ObjectType = exports.ObjectType || (exports.ObjectType = {}));
//# sourceMappingURL=ObjectType.js.map