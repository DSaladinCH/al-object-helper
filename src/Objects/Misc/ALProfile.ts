import { ALApp, ALObject, ObjectType } from "../../internal";

export class ALProfile extends ALObject {
    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.Profile, objectID, objectName, alApp);
    }

    addLocalEvents() {
        
    }
}