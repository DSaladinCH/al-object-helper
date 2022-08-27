// Also edit "getObjectTypeFromString" in HelperFunctions, "createByObjectType" in ALObject, "getObjectTypeByShortcut" in ALObject, "getParentObjectFromType" in ALExtension and "getEventSubscriberText" in ALFunction

export enum ObjectType {
    Table,
    TableExtension,
    Page,
    PageExtension,
    Codeunit,
    Xmlport,
    Report,
    ReportExtension,
    Query,
    Enum,
    EnumExtension,
    ControlAddIn,
    DotNet,
    Entitlement,
    Interface,
    PermissionSet,
    PermissionSetExtension,
    Profile,
    RequestPage,
    NotAvailable
}