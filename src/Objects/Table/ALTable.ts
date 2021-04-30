import lineReader = require("line-reader");
import { extensionPrefix } from "../../extension";
import { ALApp, ALFunction, ALObject, ALTableField, ALVariable, FunctionType, ObjectType, Reader } from "../../internal";

export class ALTable extends ALObject {
    fields: ALTableField[] = [];

    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.Table, objectID, objectName, alApp);
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

        //**************//
        //*** Delete ***//
        //**************//
        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("RunTrigger", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        this.functions.push(new ALFunction(FunctionType.InternalEvent, "OnBeforeDeleteEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));

        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("RunTrigger", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        this.functions.push(new ALFunction(FunctionType.InternalEvent, "OnAfterDeleteEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));

        //**************//
        //*** Insert ***//
        //**************//
        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("RunTrigger", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        this.functions.push(new ALFunction(FunctionType.InternalEvent, "OnBeforeInsertEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));

        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("RunTrigger", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        this.functions.push(new ALFunction(FunctionType.InternalEvent, "OnAfterInsertEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));

        //**************//
        //*** Modify ***//
        //**************//
        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("xRec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("RunTrigger", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        this.functions.push(new ALFunction(FunctionType.InternalEvent, "OnBeforeModifyEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));

        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("xRec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("RunTrigger", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        this.functions.push(new ALFunction(FunctionType.InternalEvent, "OnAfterModifyEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));

        //**************//
        //*** Rename ***//
        //**************//
        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("xRec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("RunTrigger", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        this.functions.push(new ALFunction(FunctionType.InternalEvent, "OnBeforeRenameEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));

        alVariables = [];
        alVariables.push(new ALVariable("Rec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("xRec", "Record", this.objectName, 0, { isTemporary: false, isVar: true }));
        alVariables.push(new ALVariable("RunTrigger", "Boolean", "", 0, { isTemporary: false, isVar: false }));
        this.functions.push(new ALFunction(FunctionType.InternalEvent, "OnAfterRenameEvent", { lineNo: 0, parameters: alVariables, returnValue: returnValue, isLocal: false }));
    }
}