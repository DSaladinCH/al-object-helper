export class ALEnumField {
    fieldID: string;
    fieldName: string;
    properties: Map<string, string> = new Map<string, string>();

    constructor(fieldID: string, fieldName: string) {
        this.fieldID = fieldID;
        this.fieldName = fieldName;
    }
}