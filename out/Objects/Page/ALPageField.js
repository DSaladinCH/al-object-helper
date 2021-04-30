"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALPageField = void 0;
const internal_1 = require("../../internal");
class ALPageField {
    constructor(fieldName, sourceValue, lineNo) {
        this.fieldName = fieldName;
        if (this.fieldName.startsWith("\"") && this.fieldName.endsWith("\"")) {
            this.fieldName = this.fieldName.substring(1);
            this.fieldName = this.fieldName.substring(0, this.fieldName.length - 1);
        }
        this.sourceValue = sourceValue;
        this.lineNo = lineNo;
    }
    getDisplayText() {
        return `(field) "${this.fieldName}"`;
    }
    static addToObject(alObject, pageField) {
        switch (alObject.objectType) {
            case internal_1.ObjectType.Page:
                alObject.fields.push(pageField);
                break;
            case internal_1.ObjectType.PageExtension:
                alObject.fields.push(pageField);
                break;
        }
    }
    static addValidateEvent(alObject, pageField) {
        // https://docs.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-event-types
        var alVariables = [];
        var returnValue;
        let pageObjectName = alObject.objectName;
        if (alObject.objectType === internal_1.ObjectType.PageExtension) {
            const parent = alObject.parent;
            if (!parent) {
                return;
            }
            pageObjectName = parent.objectName;
        }
        //************************//
        //*** OnBeforeValidate ***//
        //************************//
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", pageObjectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("xRec", "Record", pageObjectName, 0, { isTemporary: false, isVar: true }));
        alObject.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnBeforeValidateEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false, elementName: pageField.fieldName }));
        //***********************//
        //*** OnAfterValidate ***//
        //***********************//
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", pageObjectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("xRec", "Record", pageObjectName, 0, { isTemporary: false, isVar: true }));
        alObject.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnAfterValidateEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false, elementName: pageField.fieldName }));
    }
}
exports.ALPageField = ALPageField;
//# sourceMappingURL=ALPageField.js.map