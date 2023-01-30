import { ALApp, ALObject, ObjectType } from "../../internal";

export class ALEntitlement extends ALObject {
    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.Entitlement, objectID, objectName, alApp);
    }

    addLocalEvents() {

    }
}