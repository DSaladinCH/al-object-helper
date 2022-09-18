import { ALApp, ALObject, ObjectType } from "../../internal";

export class ALProfile extends ALObject {
    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.Profile, objectID, objectName, alApp);
    }

    getUIDescription(): string {
        return `${ObjectType[this.objectType]} ${this.objectID}`;
    }

    getUIDetail(): string {
        if (!this.alApp) {
            return "";
        }
        return `${this.alApp.appPublisher} - ${this.alApp.appName}`;
    }

    addLocalEvents() { }
}