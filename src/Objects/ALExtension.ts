import { ALApp, ALEnum, ALObject, ALPage, ALPermissionSet, ALReport, ALTable, ObjectType } from "../internal";

export abstract class ALExtension extends ALObject {
    parent: ALObject | undefined = undefined;

    constructor(objectPath: string, objectType: ObjectType, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, objectType, objectID, objectName, alApp);
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

    abstract setTempParentObjectFromType(objectName: string): void;

    static getParentObjectFromType(objectType: ObjectType, objectPath: string, objectID: string, objectName: string, alApp: ALApp): ALObject | undefined {
        switch (objectType) {
            case ObjectType.TableExtension:
                return new ALTable(objectPath, objectID, objectName, alApp);
            case ObjectType.PageExtension:
            case ObjectType.PageCustomization:
                return new ALPage(objectPath, objectID, objectName, alApp);
            case ObjectType.ReportExtension:
                return new ALReport(objectPath, objectID, objectName, alApp);
            case ObjectType.EnumExtension:
                return new ALEnum(objectPath, objectID, objectName, alApp);
            case ObjectType.PermissionSetExtension:
                return new ALPermissionSet(objectPath, objectID, objectName, alApp);
            default:
                return undefined;
        }
    }
}