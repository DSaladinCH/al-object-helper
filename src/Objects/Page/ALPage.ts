import { ALApp, ALFunction, ALObject, ALPageExtension, ALPageField, ALTable, ALVariable, FunctionType, HelperFunctions, ObjectType, reader } from "../../internal";

export class ALPage extends ALObject {
    fields: ALPageField[] = [];
    sourceTable: ALTable | undefined;

    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.Page, objectID, objectName, alApp);
    }

    getAllFields(): ALPageField[] {
        let alFields: ALPageField[] = [];
        alFields = alFields.concat(this.fields);

        let extensions = this.getAllExtensions(reader.alApps);
        extensions.forEach(extension => {
            alFields = alFields.concat((extension as ALPageExtension).fields);
        });

        return alFields;
    }

    /**
     * Search a page field by its name in the page and all page extensions
     * @param fieldName The field name which should be searched
     */
    searchField(fieldName: string): { alObject: ALObject, field: ALPageField } | undefined {
        let field = this.fields.find(alField => alField.fieldName === fieldName);
        if (field) {
            return { alObject: this, field: field };
        }

        let extensions = this.getAllExtensions(reader.alApps);
        for (let i = 0; i < extensions.length; i++) {
            field = (extensions[i] as ALPageExtension).fields.find(alField => alField.fieldName === fieldName);
            if (field) {
                return { alObject: extensions[i], field: field };
            }
        }

        return undefined;
    }

    addLocalEvents() {
        var alVariables: ALVariable[] = [];
        var returnValue: ALVariable | undefined;

        if (!this.sourceTable) {
            return;
        }

        //*********************//
        //*** GetCurrRecord ***//
        //*********************//
        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        this.functions.push(new ALFunction(FunctionType.InternalEvent, "OnAfterGetCurrRecordEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));

        //*****************//
        //*** GetRecord ***//
        //*****************//
        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        this.functions.push(new ALFunction(FunctionType.InternalEvent, "OnAfterGetRecordEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));

        //*******************//
        //*** OnClosePage ***//
        //*******************//
        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        this.functions.push(new ALFunction(FunctionType.InternalEvent, "OnClosePageEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));

        //**********************//
        //*** OnDeleteRecord ***//
        //**********************//
        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("AllowDelete", "Boolean", "", 0, { isTemporary: false, isVar: true }));
        this.functions.push(new ALFunction(FunctionType.InternalEvent, "OnDeleteRecordEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));

        //**********************//
        //*** OnInsertRecord ***//
        //**********************//
        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("BelowxRec", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        alVariables.push(new ALVariable("xRec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("AllowInsert", "Boolean", "", 0, { isTemporary: false, isVar: true }));
        this.functions.push(new ALFunction(FunctionType.InternalEvent, "OnInsertRecordEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));

        //**********************//
        //*** OnModifyRecord ***//
        //**********************//
        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("xRec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("AllowModify", "Boolean", "", 0, { isTemporary: false, isVar: true }));
        this.functions.push(new ALFunction(FunctionType.InternalEvent, "OnModifyRecordEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));

        //*******************//
        //*** OnNewRecord ***//
        //*******************//
        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("BelowxRec", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        alVariables.push(new ALVariable("xRec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        this.functions.push(new ALFunction(FunctionType.InternalEvent, "OnNewRecordEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));

        //******************//
        //*** OnOpenPage ***//
        //******************//
        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        this.functions.push(new ALFunction(FunctionType.InternalEvent, "OnOpenPageEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));

        //************************//
        //*** OnQueryClosePage ***//
        //************************//
        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("AllowClose", "Boolean", "", 0, { isTemporary: false, isVar: true }));
        this.functions.push(new ALFunction(FunctionType.InternalEvent, "OnQueryClosePageEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
    }
}