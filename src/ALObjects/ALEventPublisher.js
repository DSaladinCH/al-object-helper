const ALObject = require("./ALObject");

module.exports = class ALEventPublisher {
    constructor(alObject, eventType, functionString, eventName, elementName) {
        if (!(alObject instanceof ALObject))
            return;
        this.eventType = eventType;

        var start = functionString.indexOf("procedure ");
        if (start == -1)
            return;
        start += "procedure ".length;
        var end = functionString.indexOf("(", start);
        this.eventName = functionString.substring(start, end);
        this.displayEventName = this.eventName;
        
        if (eventName != undefined) {
            this.displayEventName = this.eventName;
            this.eventName = eventName;
        }

        this.elementName = elementName;
        if (this.elementName == undefined)
            this.elementName = "";

        if (this.elementName == "")
            this.functionString = functionString.trim().replace(this.displayEventName, alObject.name.replace(/\s/g, '') + "_" + this.displayEventName);
        else {
            this.functionString = functionString.trim().replace(this.displayEventName, alObject.name.replace(/\s/g, '') + "_" + this.displayEventName + "_" +
                this.elementName.replace(/[^0-9a-z]/gi, ''));
            this.displayEventName += this.elementName.replace(/[^0-9a-z]/gi, '');
        }
        this.objectType = alObject.type;
        this.displayObjectType = alObject.displayType;
        this.objectName = alObject.name;
    }

    toString() {
        return `[EventSubscriber(ObjectType::${this.displayObjectType}, Database::"${this.objectName}", '${this.eventName}', '${this.elementName}', false, false)]\n` +
            `\t${this.functionString}\n` +
            `\tbegin\n` +
            `\tend;`;
    }
}