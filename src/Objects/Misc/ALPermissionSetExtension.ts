import { ALApp, ALExtension, ALPermissionSet, ObjectType } from "../../internal";

export class ALPermissionSetExtension extends ALExtension {
    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.PermissionSetExtension, objectID, objectName, alApp);
    }

    setTempParentObjectFromType(objectName: string) {
        this.parent = new ALPermissionSet('', '', objectName, ALApp.Empty());
    }

    addLocalEvents() {

    }
}