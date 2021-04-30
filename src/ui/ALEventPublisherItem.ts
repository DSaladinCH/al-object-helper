import { ALApp, ALFunction, ALObject, ALTable } from "../internal";

export class ALEventPublisherItem {
    label: string;
    description: string = "";
    detail: string = "";
    alFunction: ALFunction;

    constructor(alFunction: ALFunction) {
        this.label = alFunction.functionName + alFunction.elementName.replace(/\W/g, "");
        this.alFunction = alFunction;
    }
}