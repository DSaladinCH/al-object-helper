import { ALApp, ALObject, ObjectType } from "../../internal";

export class ALQuery extends ALObject {
    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.Query, objectID, objectName, alApp);
    }

    addLocalEvents() {

    }
}