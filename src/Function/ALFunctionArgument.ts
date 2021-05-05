export class ALFunctionArgument {
    subscriberObjectType: string = "";
    subscriberObjectName: string = "";
    subscriberEventName: string = "";
    eventElementName: string = "";

    constructor() {

    }

    static createEventPublisher(elementName: string): ALFunctionArgument {
        let functionArgument = new ALFunctionArgument();
        functionArgument.eventElementName = elementName;

        return functionArgument;
    }

    static createEventSubscriber(objectType: string, objectName: string, eventName: string, elementName: string): ALFunctionArgument {
        let functionArgument = new ALFunctionArgument();
        functionArgument.subscriberObjectType = objectType;
        functionArgument.subscriberObjectName = objectName;
        functionArgument.subscriberEventName = eventName;
        functionArgument.eventElementName = elementName;

        return functionArgument;
    }
}