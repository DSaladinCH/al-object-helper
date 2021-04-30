import { ALApp, ALFunction, ALObject, ALPageField, ALTable, ALVariable, FunctionType, ObjectType, Reader } from "../../internal";

export class ALPage extends ALObject {
    fields: ALPageField[] = [];
    sourceTable: ALTable | undefined;

    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.Page, objectID, objectName, alApp);
    }

    getUIDescription(): string {
        return `${ObjectType[this.objectType]} ${this.objectID}`;
    }

    getUIDetail(): string {
        if (!this.alApp) {
            return "";
        }
        return `${this.alApp.appPublisher} - ${this.alApp.appName}`;
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