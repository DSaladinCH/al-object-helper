import { ALApp, ALExtension, ALObject, ALPage, ALPageAction, ALPageControl, ALPageField, ObjectType } from "../../internal";

export class ALPageCustomization extends ALExtension {
    fields: ALPageField[] = [];
    controls: ALPageControl[] = [];
    actions: ALPageAction[] = [];

    constructor(objectPath: string, objectID: string, objectName: string, alApp: ALApp) {
        super(objectPath, ObjectType.PageCustomization, objectID, objectName, alApp);
    }

    setTempParentObjectFromType(objectName: string) {
        this.parent = new ALPage('', '', objectName, ALApp.Empty());
    }

    getUIDescription(): string {
        let description = `${ObjectType[this.objectType]} ${this.objectID}`;
        if (this.parent === undefined) {
            return " - Customizes unknown";
        }

        if (this.parent.objectID === "") {
            description += ` - Customizes "${this.parent.objectName}"`;
        }
        else {
            description += ` - Customizes ${ObjectType[this.parent.objectType]} ${this.parent.objectID} - ${this.parent.objectName}`;
        }

        return description;
    }

    getUIDetail(): string {
        if (!this.alApp) {
            return "";
        }
        return `${this.alApp.appPublisher} - ${this.alApp.appName}`;
    }

    /**
     * Search a page field by its name in the page and all page extensions
     * @param fieldName The field name which should be searched
     */
    searchField(fieldName: string): { alObject: ALObject, field: ALPageField } | undefined {
        let field = this.fields.find(alField => alField.fieldName === fieldName);
        if (field) {
            return { alObject: this, field: field };
        }

        if (!this.parent) {
            return undefined;
        }

        return (this.parent as ALPage).searchField(fieldName);
    }

    addLocalEvents() {

    }
}