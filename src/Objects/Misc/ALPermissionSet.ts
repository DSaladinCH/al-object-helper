import { ALApp, ALObject, ObjectType } from "../../internal";

export class ALPermissionSet extends ALObject {
    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.PermissionSet, objectID, objectName, alApp);
    }

    addLocalEvents() {

    }
}