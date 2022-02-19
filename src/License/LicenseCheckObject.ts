import { ALObject, ObjectType } from "../internal";

export class LicenseCheckObject {
    objectType: string;
    objectID: string;
    objectName: string;
    fixObjectID: string = "";
    objectPath: string;

    constructor(alObject: ALObject, fixALObject: ALObject | undefined) {
        this.objectType = ObjectType[alObject.objectType];
        this.objectID = alObject.objectID;
        this.objectName = alObject.objectName;
        if (fixALObject) {
            this.fixObjectID = fixALObject.objectID;
        }
        this.objectPath = alObject.objectPath;
    }

    public static getJson(licenseData: LicenseCheckObject[]): string {
        return JSON.stringify(licenseData);
    }
}