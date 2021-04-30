"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALTableField = void 0;
const internal_1 = require("../../internal");
class ALTableField {
    constructor(fieldID, fieldName, dataType /*, subType: string*/, lineNo) {
        this.fieldID = fieldID;
        this.fieldName = fieldName;
        if (this.fieldName.startsWith("\"") && this.fieldName.endsWith("\"")) {
            this.fieldName = this.fieldName.substring(1);
            this.fieldName = this.fieldName.substring(0, this.fieldName.length - 1);
        }
        this.dataType = dataType;
        // this.subType = subType;
        this.lineNo = lineNo;
    }
    getDisplayText() {
        return `(field) ${this.fieldID} - "${this.fieldName}": ${this.dataType}`;
    }
    static addToObject(alObject, tableField) {
        switch (alObject.objectType) {
            case internal_1.ObjectType.Table:
                alObject.fields.push(tableField);
                break;
            case internal_1.ObjectType.TableExtension:
                alObject.fields.push(tableField);
                break;
        }
    }
    static addValidateEvent(alObject, tableField) {
        // https://docs.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-event-types
        var alVariables = [];
        var returnValue;
        let tableObjectName = alObject.objectName;
        if (alObject.objectType === internal_1.ObjectType.TableExtension) {
            const parent = alObject.parent;
            if (!parent) {
                return;
            }
            tableObjectName = parent.objectName;
        }
        //************************//
        //*** OnBeforeValidate ***//
        //************************//
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", tableObjectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("xRec", "Record", tableObjectName, 0, { isTemporary: false, isVar: true }));
        alObject.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnBeforeValidateEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false, elementName: tableField.fieldName }));
        //***********************//
        //*** OnAfterValidate ***//
        //***********************//
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", tableObjectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("xRec", "Record", tableObjectName, 0, { isTemporary: false, isVar: true }));
        alObject.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnAfterValidateEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false, elementName: tableField.fieldName }));
    }
}
exports.ALTableField = ALTableField;
//# sourceMappingURL=ALTableField.js.map