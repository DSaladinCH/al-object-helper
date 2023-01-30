import { ALApp, ALExtension, ALObject, ALTable, ALTableField, ObjectType } from "../../internal";

export class ALTableExtension extends ALExtension {
    fields: ALTableField[] = [];

    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.TableExtension, objectID, objectName, alApp);
    }

    setTempParentObjectFromType(objectName: string) {
        this.parent = new ALTable('', '', objectName, ALApp.Empty());
    }

    /**
     * Search a table field by its name in the table and all table extensions
     * @param fieldName The field name which should be searched
     */
    searchField(fieldName: string): { alObject: ALObject, field: ALTableField } | undefined {
        let field = this.fields.find(alField => alField.fieldName === fieldName);
        if (field) {
            return { alObject: this, field: field };
        }

        if (!this.parent) {
            return undefined;
        }

        return (this.parent as ALTable).searchField(fieldName);
    }

    addLocalEvents() {

    }
}