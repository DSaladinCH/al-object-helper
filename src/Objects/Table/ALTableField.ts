import { ALFunction, ALObject, ALTable, ALTableExtension, ALVariable, FunctionType, ObjectType } from "../../internal";

export class ALTableField {
    fieldID: string;
    fieldName: string;
    dataType: string;
    // subType: string;
    lineNo: number;

    constructor(fieldID: string, fieldName: string, dataType: string/*, subType: string*/, lineNo: number) {
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

    getDisplayText(format?: boolean): string {
        const idMaxLength = 10;
        const spaceAfterID = 0;
        const nameMaxLength = 30;
        const spaceAfterName = 0;

        if (!format) {
            return `(field) ${this.fieldID} - "${this.fieldName}": ${this.dataType}`;
        }

        let fieldText = "";
        fieldText += this.fieldID;
        for (let i = 0; i < idMaxLength - this.fieldID.length + spaceAfterID; i++) {
            fieldText += " ";
        }

        fieldText += ` - "${this.fieldName}"`;
        for (let i = 0; i < nameMaxLength - this.fieldName.length + spaceAfterName; i++) {
            fieldText += " ";
        }

        fieldText += `: ${this.dataType}`;
        return fieldText;
    }

    static addToObject(alObject: ALObject, tableField: ALTableField) {
        switch (alObject.objectType) {
            case ObjectType.Table:
                (alObject as ALTable).fields.push(tableField);
                break;
            case ObjectType.TableExtension:
                (alObject as ALTableExtension).fields.push(tableField);
                break;
        }
    }

    static addValidateEvent(alObject: ALObject, tableField: ALTableField) {
        // https://docs.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-event-types

        var alVariables: ALVariable[] = [];
        var returnValue: ALVariable | undefined;
        let tableObjectName = alObject.objectName;
        if (alObject.objectType === ObjectType.TableExtension) {
            const parent = (alObject as ALTableExtension).parent;
            if (!parent) { return; }
            tableObjectName = parent.objectName;
        }

        //************************//
        //*** OnBeforeValidate ***//
        //************************//
        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", tableObjectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("xRec", "Record", tableObjectName, 0, { isTemporary: false, isVar: true }));
        alObject.functions.push(new ALFunction(FunctionType.InternalEvent, "OnBeforeValidateEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false, elementName: tableField.fieldName }));

        //***********************//
        //*** OnAfterValidate ***//
        //***********************//
        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", tableObjectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("xRec", "Record", tableObjectName, 0, { isTemporary: false, isVar: true }));
        alObject.functions.push(new ALFunction(FunctionType.InternalEvent, "OnAfterValidateEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false, elementName: tableField.fieldName }));
    }
}