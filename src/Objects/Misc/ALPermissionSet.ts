import { ALApp, ALObject, ObjectType, PermissionSetElement } from "../../internal";

export class ALPermissionSet extends ALObject {
    permissions: PermissionSetElement[] = [];

    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.PermissionSet, objectID, objectName, alApp);
    }

    addLocalEvents() {

    }
}