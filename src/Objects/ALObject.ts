import { ALApp, ALCodeunit, ALEnum, ALEnumExtension, ALExtension, ALFunction, ALPage, ALPageExtension, ALQuery, ALReport, ALReportExtension, ALTable, ALTableExtension, ALVariable, ALXmlport, ObjectType, Reader } from "../internal";

export abstract class ALObject {
    objectType: ObjectType;
    objectID: string;
    objectName: string;
    objectPath: string;
    alApp: ALApp;
    functions: ALFunction[] = [];
    variables: ALVariable[] = [];

    constructor(objectPath: string, objectType: ObjectType, objectID: string, objectName: string, alApp: ALApp) {
        this.objectPath = objectPath;
        this.objectType = objectType;
        this.objectID = objectID;
        this.objectName = objectName;
        if (this.objectName.startsWith("\"")) {
            this.objectName = this.objectName.substring(1);
            this.objectName = this.objectName.substring(0, this.objectName.length - 1);
        }
        this.alApp = alApp;
    }

    static getObjectFromType(objectType: ObjectType, objectPath: string, objectID: string, objectName: string, alApp: ALApp): ALObject | ALExtension | undefined {
        switch (objectType) {
            case ObjectType.Table:
                return new ALTable(objectPath, objectID, objectName, alApp);
            case ObjectType.TableExtension:
                return new ALTableExtension(objectPath, objectID, objectName, alApp);
            case ObjectType.Page:
                return new ALPage(objectPath, objectID, objectName, alApp);
            case ObjectType.PageExtension:
                return new ALPageExtension(objectPath, objectID, objectName, alApp);
            case ObjectType.Codeunit:
                return new ALCodeunit(objectPath, objectID, objectName, alApp);
            case ObjectType.Xmlport:
                return new ALXmlport(objectPath, objectID, objectName, alApp);
            case ObjectType.Report:
                return new ALReport(objectPath, objectID, objectName, alApp);
            case ObjectType.ReportExtension:
                return new ALReportExtension(objectPath, objectID, objectName, alApp);
            case ObjectType.Query:
                return new ALQuery(objectPath, objectID, objectName, alApp);
            case ObjectType.Enum:
                return new ALEnum(objectPath, objectID, objectName, alApp);
            case ObjectType.EnumExtension:
                return new ALEnumExtension(objectPath, objectID, objectName, alApp);
            default:
                return undefined;
        }
    }

    abstract getUIDescription(): string;
    abstract getUIDetail(): string;
    abstract addLocalEvents(): void;

    isExtension(): boolean {
        switch (this.objectType) {
            case ObjectType.TableExtension:
            case ObjectType.PageExtension:
            case ObjectType.EnumExtension:
                return true;
            default:
                return false;
        }
    }

    isEqual(alObject: ALObject): Boolean {
        if (this.alApp.appPublisher !== alObject.alApp.appPublisher) {
            return false;
        }

        if (this.alApp.appName !== alObject.alApp.appName) {
            return false;
        }

        if (this.objectType !== alObject.objectType) {
            return false;
        }

        if (this.objectName !== alObject.objectName) {
            return false;
        }

        if (this.objectID !== "" && alObject.objectID !== "") {
            if (this.objectID !== alObject.objectID) {
                return false;
            }
        }

        return true;
    }
}