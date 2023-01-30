import { ALApp, ALObject, ObjectType } from "../../internal";

export class ALInterface extends ALObject {
    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.Interface, objectID, objectName, alApp);
    }

    addLocalEvents() {

    }
}