import { ALFunction, ALObject, FunctionType } from "../internal";

export class ALFunctionItem {
    label: string;
    description: string = "";
    detail: string = "";
    alFunction: ALFunction;
    alObject: ALObject;

    /**
     * Create new al function item
     * @param alObject Source al object (in which the function exists)
     * @param alFunction AL function
     * @param includeElementName Defines if the element name of a event should be included
     */
    constructor(alObject: ALObject, alFunction: ALFunction, includeElementName?: boolean) {
        this.label = alFunction.functionName;
        if (includeElementName) {
            this.label += alFunction.functionArgument?.eventElementName.replace(/\W/g, "");
        }

        if (alFunction.functionType === FunctionType.EventSubscriber) {
            if (alFunction.functionArgument) {
                this.label = alFunction.functionArgument.subscriberEventName + alFunction.functionArgument.eventElementName.replace(/\W/g, "");
                this.description = `${alFunction.functionArgument.subscriberObjectType} ${alFunction.functionArgument.subscriberObjectName}`;
            }
        }

        this.alObject = alObject;
        this.alFunction = alFunction;
    }
}