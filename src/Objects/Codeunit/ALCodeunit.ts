import { ALApp, ALObject, ObjectType } from "../../internal";

export class ALCodeunit extends ALObject {
    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.Codeunit, objectID, objectName, alApp);
    }

    addLocalEvents() {

    }
}