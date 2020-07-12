const ALEventPublisher = require("../ALEventPublisher");

module.exports = class ALEventPublisherItem {
    constructor(eventPublisher) {
        if (!(eventPublisher instanceof ALEventPublisher))
            return;
        this.label = eventPublisher.displayEventName;
        this.eventPublisher = eventPublisher;
    }

    static convertToALEventPublisherItem(obj) {
        return Object.assign(this, obj);
    }
}