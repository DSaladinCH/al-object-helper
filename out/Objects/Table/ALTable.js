"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALTable = void 0;
const internal_1 = require("../../internal");
class ALTable extends internal_1.ALObject {
    constructor(objectPath, objectID, objectName, alApp) {
        super(objectPath, internal_1.ObjectType.Table, objectID, objectName, alApp);
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
        //**************//
        //*** Delete ***//
        //**************//
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("RunTrigger", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        this.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnBeforeDeleteEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("RunTrigger", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        this.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnAfterDeleteEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
        //**************//
        //*** Insert ***//
        //**************//
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("RunTrigger", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        this.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnBeforeInsertEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("RunTrigger", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        this.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnAfterInsertEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
        //**************//
        //*** Modify ***//
        //**************//
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("xRec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("RunTrigger", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        this.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnBeforeModifyEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("xRec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("RunTrigger", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        this.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnAfterModifyEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
        //**************//
        //*** Rename ***//
        //**************//
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("xRec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("RunTrigger", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        this.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnBeforeRenameEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
        alVariables = [];
        alVariables.push(new internal_1.ALVariable("Rec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("xRec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new internal_1.ALVariable("RunTrigger", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        this.functions.push(new internal_1.ALFunction(internal_1.FunctionType.InternalEvent, "OnAfterRenameEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
    }
}
exports.ALTable = ALTable;
//# sourceMappingURL=ALTable.js.map