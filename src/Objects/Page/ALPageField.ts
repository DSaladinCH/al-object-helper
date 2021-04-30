import { ALFunction, ALObject, ALPage, ALPageExtension, ALVariable, FunctionType, ObjectType } from "../../internal";

export class ALPageField {
    fieldName: string;
    sourceValue: string;
    lineNo: number;

    constructor(fieldName: string, sourceValue: string, lineNo: number) {
        this.fieldName = fieldName;
        if (this.fieldName.startsWith("\"") && this.fieldName.endsWith("\"")){
            this.fieldName = this.fieldName.substring(1);
            this.fieldName = this.fieldName.substring(0, this.fieldName.length - 1);
        }
        this.sourceValue = sourceValue;
        this.lineNo = lineNo;
    }

    getDisplayText(): string {
        return `(field) "${this.fieldName}"`;
    }

    static addToObject(alObject: ALObject, pageField: ALPageField) {
        switch (alObject.objectType) {
            case ObjectType.Page:
                (alObject as ALPage).fields.push(pageField);
                break;
            case ObjectType.PageExtension:
                (alObject as ALPageExtension).fields.push(pageField);
                break;
        }
    }

    static addValidateEvent(alObject: ALObject, pageField: ALPageField){
        // https://docs.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-event-types

        var alVariables: ALVariable[] = [];
        var returnValue: ALVariable | undefined;
        let pageObjectName = alObject.objectName;
        if (alObject.objectType === ObjectType.PageExtension) {
            const parent = (alObject as ALPageExtension).parent;
            if (!parent) { return; }
            pageObjectName = parent.objectName;
        }

        //************************//
        //*** OnBeforeValidate ***//
        //************************//
        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", pageObjectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("xRec", "Record", pageObjectName, 0, { isTemporary: false, isVar: true }));
        alObject.functions.push(new ALFunction(FunctionType.InternalEvent, "OnBeforeValidateEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false, elementName: pageField.fieldName }));

        //***********************//
        //*** OnAfterValidate ***//
        //***********************//
        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", pageObjectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("xRec", "Record", pageObjectName, 0, { isTemporary: false, isVar: true }));
        alObject.functions.push(new ALFunction(FunctionType.InternalEvent, "OnAfterValidateEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false, elementName: pageField.fieldName }));
    }
}