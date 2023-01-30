import { ALApp, ALObject, ObjectType } from "../../internal";

export class ALXmlport extends ALObject {
    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.Xmlport, objectID, objectName, alApp);
    }

    addLocalEvents() {

    }
}