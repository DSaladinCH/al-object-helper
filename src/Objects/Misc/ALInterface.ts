import { ALApp, ALObject, ObjectType } from "../../internal";

export class ALInterface extends ALObject {
    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.Interface, objectID, objectName, alApp);
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