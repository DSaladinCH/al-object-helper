import { ALApp, ALObject, ObjectType } from "../../internal";

export class ALDotNet extends ALObject {
    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.DotNet, objectID, objectName, alApp);
    }

    addLocalEvents() {

    }
}