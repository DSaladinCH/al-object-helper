import { ALApp, ALObject, ObjectType } from "../../internal";

export class ALControlAddIn extends ALObject {
    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.ControlAddIn, objectID, objectName, alApp);
    }

    addLocalEvents() {

    }
}