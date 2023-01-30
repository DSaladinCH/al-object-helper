import { ALObject, ALEnumField, ObjectType, ALApp } from "../../internal";

export class ALEnum extends ALObject {
    fields: ALEnumField[] = [];

    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.Enum, objectID, objectName, alApp);
    }

    addLocalEvents() {

    }
}