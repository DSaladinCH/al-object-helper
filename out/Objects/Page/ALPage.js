"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALPage = void 0;
const internal_1 = require("../../internal");
class ALPage extends internal_1.ALObject {
    constructor(objectPath, objectID, objectName, alApp) {
        super(objectPath, internal_1.ObjectType.Page, objectID, objectName, alApp);
        this.fields = [];
    }
    getUIDescription() {
        return `${internal_1.ObjectType[this.objectType]} ${this.objectID}`;
    }
    getUIDetail() {
        if (!this.alApp) {
            return "";
        }
        return `${this.alApp.appPublisher} - ${this.alApp.appName}`;
    }
    addLocalEvents() {
        var alVariables = [];
        var returnValue;
        if (!this.sourceTable) {
            return;
        }
        //*********************//
        //*** GetCurrRecord ***//
        //*********************//
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        this.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnAfterGetCurrRecordEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
        //*****************//
        //*** GetRecord ***//
        //*****************//
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        this.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnAfterGetRecordEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
        //*******************//
        //*** OnClosePage ***//
        //*******************//
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        this.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnClosePageEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
        //**********************//
        //*** OnDeleteRecord ***//
        //**********************//
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("AllowDelete", "Boolean", "", 0, { isTemporary: false, isVar: true }));
        this.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnDeleteRecordEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
        //**********************//
        //*** OnInsertRecord ***//
        //**********************//
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("BelowxRec", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        alVariables.push(new internal_1.ALVariable("xRec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("AllowInsert", "Boolean", "", 0, { isTemporary: false, isVar: true }));
        this.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnInsertRecordEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
        //**********************//
        //*** OnModifyRecord ***//
        //**********************//
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("xRec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("AllowModify", "Boolean", "", 0, { isTemporary: false, isVar: true }));
        this.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnModifyRecordEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
        //*******************//
        //*** OnNewRecord ***//
        //*******************//
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("BelowxRec", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        alVariables.push(new internal_1.ALVariable("xRec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        this.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnNewRecordEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
        //******************//
        //*** OnOpenPage ***//
        //******************//
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        this.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnOpenPageEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
        //************************//
        //*** OnQueryClosePage ***//
        //************************//
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", this.sourceTable.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("AllowClose", "Boolean", "", 0, { isTemporary: false, isVar: true }));
        this.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnQueryClosePageEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
    }
}
exports.ALPage = ALPage;
//# sourceMappingURL=ALPage.js.map