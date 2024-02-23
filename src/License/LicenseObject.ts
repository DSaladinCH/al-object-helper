import { ObjectType } from "../internal";

export class LicenseObject {
    objectType: ObjectType;
    moduleName: string | undefined;
    rangeFrom: string;
    rangeTo: string;

    readPermission: Boolean;
    insertPermission: Boolean;
    modifyPermission: Boolean;
    deletePermission: Boolean;
    executePermission: Boolean;

    constructor(objectType: ObjectType, rangeFrom: string, rangeTo: string, rimdx: string, moduleName?: string) {
        this.objectType = objectType;
        this.rangeFrom = rangeFrom;
        this.rangeTo = rangeTo;

        if (rimdx.length !== 5) { throw new Error(`The permission string ${rimdx} is not valid`); }
        const rimdxPermissions = rimdx.split("");

        this.readPermission = !(rimdxPermissions[0] === "-");
        this.insertPermission = !(rimdxPermissions[1] === "-");
        this.modifyPermission = !(rimdxPermissions[2] === "-");
        this.deletePermission = !(rimdxPermissions[3] === "-");
        this.executePermission = !(rimdxPermissions[4] === "-");

        this.moduleName = moduleName;
    }

    static getObjectType(objectType: string): ObjectType | undefined {
        switch (objectType.toLowerCase()) {
            case "tabledata":
                return ObjectType.Table;
            case "page":
                return ObjectType.Page;
            case "codeunit":
                return ObjectType.Codeunit;
            case "xmlport":
                return ObjectType.Xmlport;
            case "report":
                return ObjectType.Report;
            case "query":
                return ObjectType.Query;
            default:
                return undefined;
        }
    }

    static isLicenseImportant(objectType: ObjectType): Boolean {
        switch (objectType) {
            case ObjectType.TableExtension:
            case ObjectType.PageExtension:
            case ObjectType.ReportExtension:
            case ObjectType.Enum:
            case ObjectType.EnumExtension:
            case ObjectType.Query:
            case ObjectType.ControlAddIn:
            case ObjectType.Entitlement:
            case ObjectType.Interface:
            case ObjectType.DotNet:
            case ObjectType.PermissionSet:
            case ObjectType.PermissionSetExtension:
            case ObjectType.Profile:
                return false;
        }

        return true;
    }
}