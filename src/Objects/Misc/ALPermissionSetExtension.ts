import { ALApp, ALExtension, ALPermissionSet, ObjectType } from "../../internal";

export class ALPermissionSetExtension extends ALExtension {
    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.PermissionSetExtension, objectID, objectName, alApp);
    }

    setTempParentObjectFromType(objectName: string) {
        this.parent = new ALPermissionSet('', '', objectName, ALApp.Empty());
    }

    getUIDescription(): string {
        let description = `${ObjectType[this.objectType]} ${this.objectID}`;
        if (this.parent === undefined) {
            return " - Extends unknown";
        }

        if (this.parent.objectID === "") {
            description += ` - Extends "${this.parent.objectName}"`;
        }
        else {
            description += ` - Extends ${ObjectType[this.parent.objectType]} ${this.parent.objectID} - ${this.parent.objectName}`;
        }

        return description;
    }

    getUIDetail(): string {
        if (!this.alApp) {
            return "";
        }
        return `${this.alApp.appPublisher} - ${this.alApp.appName}`;
    }

    addLocalEvents() { }
}