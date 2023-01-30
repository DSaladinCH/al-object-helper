import { ALApp, ALObject, ObjectType } from "../../internal";

export class ALReport extends ALObject {
    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.Report, objectID, objectName, alApp);
    }

    addLocalEvents() {

    }
}