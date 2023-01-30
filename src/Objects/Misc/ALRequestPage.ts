import { ALApp, ALObject, ObjectType } from "../../internal";

export class ALRequestPage extends ALObject {
    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.RequestPage, objectID, objectName, alApp);
    }

    addLocalEvents() {

    }
}