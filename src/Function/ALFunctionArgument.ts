export class ALFunctionArgument {
    subscriberObjectType: string = "";
    subscriberObjectName: string = "";
    subscriberEventName: string = "";
    eventElementName: string = "";
    includeSender: Boolean = false;
    globalVarAccess: Boolean = false;
    isolated: Boolean = false;

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

    static createIntegrationEvent(includeSender: Boolean, globalVarAccess: Boolean, isolated: Boolean): ALFunctionArgument {
        let functionArgument = new ALFunctionArgument();
        functionArgument.includeSender = includeSender;
        functionArgument.globalVarAccess = globalVarAccess;
        functionArgument.isolated = isolated;

        return functionArgument;
    }

    static createInternalEvent(includeSender: Boolean, isolated: Boolean): ALFunctionArgument {
        let functionArgument = new ALFunctionArgument();
        functionArgument.includeSender = includeSender;
        functionArgument.isolated = isolated;

        return functionArgument;
    }

    static createBusinessEvent(includeSender: Boolean, isolated: Boolean): ALFunctionArgument {
        let functionArgument = new ALFunctionArgument();
        functionArgument.includeSender = includeSender;
        functionArgument.isolated = isolated;

        return functionArgument;
    }
}