module.exports = class ALEventSubscriber {
    constructor(functionString, path, lineNo) {
        this.path = path;
        this.lineNo = lineNo;
        this.functionString = functionString;

        var start, end = 0;
        start = functionString.indexOf("[EventSubscriber(ObjectType::");
        if (start == -1)
            return;

        start += "[EventSubscriber(ObjectType::".length;
        end = functionString.indexOf(",", start);
        this.objectType = functionString.substring(start, end).trim();

        // Überprüfen ob nur Zahlen (ID), wenn nicht sollte das DATABASE und die Anführungszeichen noch entfernt werden
        start = end + 1;
        end = functionString.indexOf(",", start);
        this.objectName = functionString.substring(start, end).trim();
        if (!this.containsOnlyNumbers(this.objectName)) {
            this.objectName = this.objectName.substring(this.objectName.indexOf("Database::") + "Database::".length + 1).trim();
            if (this.objectName.startsWith("\"")) {
                this.objectName = this.objectName.substring(1).trim();
                this.objectName = this.objectName.substring(0, this.objectName.length - 1).trim;
            }
        }

        // Einfache Anführungszeichen entfernen
        start = end + 1;
        end = functionString.indexOf(",", start);
        this.eventName = functionString.substring(start, end).trim();
        this.eventName = this.eventName.substring(1).trim();
        this.eventName = this.eventName.substring(0, this.eventName.length - 1).trim();

        // Einfache Anführungszeichen entfernen
        start = end + 1;
        end = functionString.indexOf(",", start);
        this.elementName = functionString.substring(start, end).trim();
        this.elementName = this.elementName.substring(1).trim();
        this.elementName = this.elementName.substring(0, this.elementName.length - 1).trim();
    }

    containsOnlyNumbers(myString) {
        return /^[0-9]+$/.test(myString);
    }
}