import {
    ALApp, ALCodeunit, ALControlAddIn, ALDotNet, ALEntitlement, ALEnum, ALEnumExtension, ALExtension, ALFunction, ALInterface, ALPage, ALPageExtension, ALPermissionSet, ALPermissionSetExtension,
    ALProfile, ALQuery, ALReport, ALReportExtension, ALRequestPage, ALTable, ALTableExtension, ALVariable, ALXmlport, HelperFunctions, ObjectType, reader, shortcutRegex
} from "../internal";

export abstract class ALObject {
    objectType: ObjectType;
    objectID: string;
    objectName: string;
    objectPath: string;
    alApp: ALApp;
    functions: ALFunction[] = [];
    variables: ALVariable[] = [];
    properties: Map<string, string> = new Map<string, string>();

    constructor(objectPath: string, objectType: ObjectType, objectID: string, objectName: string, alApp: ALApp) {
        this.objectPath = objectPath;
        this.objectType = objectType;
        this.objectID = objectID === undefined ? "" : objectID;
        this.objectName = objectName;
        if (this.objectName.startsWith("\"")) {
            this.objectName = this.objectName.substring(1);
            this.objectName = this.objectName.substring(0, this.objectName.length - 1);
        }
        this.alApp = alApp;
    }

    abstract getUIDescription(): string;
    abstract getUIDetail(): string;
    abstract addLocalEvents(): void;

    isExtension(): boolean {
        switch (this.objectType) {
            case ObjectType.TableExtension:
            case ObjectType.PageExtension:
            case ObjectType.ReportExtension:
            case ObjectType.EnumExtension:
                return true;
            default:
                return false;
        }
    }

    getAllExtensions(alApps: ALApp[]): ALExtension[] {
        let alExtensions: ALExtension[] = [];
        for (let i = 0; i < alApps.length; i++) {
            const alApp = alApps[i];
            let alObjects = alApp.alObjects.filter(alObject => {
                // if object is an extension
                if (alObject.isExtension()) {
                    if ((alObject as ALExtension).parent) {
                        return (alObject as ALExtension).parent?.objectType === this.objectType &&
                            (alObject as ALExtension).parent?.objectName === this.objectName;
                    }
                }

                return false;
            });

            if (alObjects && alObjects.length > 0) {
                alExtensions = alExtensions.concat((alObjects as ALExtension[]));
            }
        }

        return alExtensions;
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

    static createByObjectType(objectType: ObjectType, objectPath: string, objectID: string, objectName: string, alApp: ALApp): ALObject | ALExtension | undefined {
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
            case ObjectType.ControlAddIn:
                return new ALControlAddIn(objectPath, objectID, objectName, alApp);
            case ObjectType.DotNet:
                return new ALDotNet(objectPath, objectID, objectName, alApp);
            case ObjectType.Entitlement:
                return new ALEntitlement(objectPath, objectID, objectName, alApp);
            case ObjectType.Interface:
                return new ALInterface(objectPath, objectID, objectName, alApp);
            case ObjectType.PermissionSet:
                return new ALPermissionSet(objectPath, objectID, objectName, alApp);
            case ObjectType.PermissionSetExtension:
                return new ALPermissionSetExtension(objectPath, objectID, objectName, alApp);
            case ObjectType.Profile:
                return new ALProfile(objectPath, objectID, objectName, alApp);
            case ObjectType.RequestPage:
                return new ALRequestPage(objectPath, objectID, objectName, alApp);
            default:
                return undefined;
        }
    }

    static getByShortcut(shortcutText: string): ALObject[] | undefined {
        let matches: RegExpMatchArray | null = shortcutText.toLowerCase().match(shortcutRegex.source);
        if (!matches || matches.length < 3) {
            return undefined;
        }
        let objectType: ObjectType | undefined = ALObject.getObjectTypeByShortcut(matches[1]);
        let searchExtension: boolean = (matches[1].length >= 2 && matches[1].toLowerCase().endsWith("e"));
        let objectID: string = matches[2];
        if (objectType === undefined) {
            return undefined;
        }
        let alObjects: ALObject[] = [];
        if (!searchExtension) {
            reader.alApps.forEach(alApp => {
                alObjects = alObjects.concat(alApp.alObjects.filter(a => a.objectType === objectType && a.objectID === objectID));
            });
        }
        else {
            reader.alApps.forEach(alApp => {
                alObjects = alObjects.concat(alApp.alObjects.filter(a => a.objectType === objectType));
            });
            alObjects = (alObjects as ALExtension[]).filter(a => a.parent?.objectID === objectID);
        }

        if (!alObjects || alObjects.length === 0) {
            return undefined;
        }

        return alObjects;
    }

    static getObjectTypeByShortcut(shortcut: string): ObjectType | undefined {
        switch (shortcut.toLowerCase()) {
            case "t":
                return ObjectType.Table;
            case "te":
            case "ted":
                return ObjectType.TableExtension;
            case "p":
                return ObjectType.Page;
            case "pe":
            case "ped":
                return ObjectType.PageExtension;
            case "e":
                return ObjectType.Enum;
            case "ee":
            case "eed":
                return ObjectType.EnumExtension;
            case "r":
                return ObjectType.Report;
            case "re":
            case "red":
                return ObjectType.ReportExtension;
            case "pse":
            case "psed":
                return ObjectType.PermissionSetExtension;
            case "c":
                return ObjectType.Codeunit;
            case "x":
                return ObjectType.Xmlport;
            case "q":
                return ObjectType.Query;
            case "ps":
                return ObjectType.PermissionSet;
            default:
                return undefined;
        }
    }

    setProperties(properties: Map<string, string>) {
        this.properties = HelperFunctions.fixProperties(properties);
    }
}