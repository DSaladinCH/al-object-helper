import { ALObject, ALEnumField, ObjectType, ALApp, Reader } from "../../internal";

export class ALEnum extends ALObject {
    fields: ALEnumField[] = [];

    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.Enum, objectID, objectName, alApp);
    }

    getUIDescription(): string{
        return `${ObjectType[this.objectType]} ${this.objectID}`;
    }

    getUIDetail(): string {
        if (!this.alApp){
            return "";
        }
        return `${this.alApp.appPublisher} - ${this.alApp.appName}`;
    }

    addLocalEvents(){
        
    }
}