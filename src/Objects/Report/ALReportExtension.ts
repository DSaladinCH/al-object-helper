import { ALApp, ALExtension, ALReport, ObjectType } from "../../internal";

export class ALReportExtension extends ALExtension {
    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.ReportExtension, objectID, objectName, alApp);
    }

    setTempParentObjectFromType(objectName: string) {
        this.parent = new ALReport('', '', objectName, ALApp.Empty());
    }

    addLocalEvents() {

    }
}