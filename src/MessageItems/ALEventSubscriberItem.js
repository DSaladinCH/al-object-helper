const ALEventSubscriber = require("../ALObjects/ALEventSubscriber");

module.exports = class ALEventSubscriberItem {
    constructor(eventSubscriber) {
        //if (!(eventSubscriber instanceof ALEventSubscriber))
            //return;
        this.label = eventSubscriber.objectType + " \"" + eventSubscriber.objectName + "\" - " + eventSubscriber.eventName;
        if (eventSubscriber.elementName != "")
            this.label += " \"" + eventSubscriber.elementName + "\"";

        this.eventSubscriber = eventSubscriber;
    }

    static convertToALEventPublisherItem(obj) {
        return Object.assign(this, obj);
    }
}