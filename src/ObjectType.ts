// Also edit "getObjectTypeFromString" in HelperFunctions, "getObjectFromType" in ALObject, "getParentObjectFromType" in ALExtension and "getEventSubscriberText" in ALFunction

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
    NotAvailable
}