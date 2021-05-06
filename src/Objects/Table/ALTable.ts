import { ALApp, ALFunction, ALObject, ALTableExtension, ALTableField, ALVariable, FunctionType, HelperFunctions, ObjectType, reader } from "../../internal";

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

    /**
     * Get all table field including table extension fields
     * @returns All table field in this table and all table extensions
     */
    getAllFields(): ALTableField[] {
        let alFields: ALTableField[] = [];
        alFields = alFields.concat(this.fields);

        let extensions = this.getAllExtensions(reader.alApps);
        extensions.forEach(extension => {
            alFields = alFields.concat((extension as ALTableExtension).fields);
        });

        return alFields;
    }

    /**
     * Search a table field by its name in the table and all table extensions
     * @param fieldName The field name which should be searched
     */
    searchField(fieldName: string): { alObject: ALObject, field: ALTableField } | undefined {
        let field = this.fields.find(alField => alField.fieldName === fieldName);
        if (field) {
            return { alObject: this, field: field };
        }

        let extensions = this.getAllExtensions(reader.alApps);
        for (let i = 0; i < extensions.length; i++) {
            field = (extensions[i] as ALTableExtension).fields.find(alField => alField.fieldName === fieldName);
            if (field) {
                return { alObject: extensions[i], field: field };
            }
        }

        return undefined;
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