import { ALExtension, ALFunctionArgument, ALObject, ALVariable, FunctionType, ObjectType } from "../internal";

/**
 * A al function with parameters and variables
 */
export class ALFunction {
    /** The typ of a function */
    functionType: FunctionType;
    /** Defines if a function is local */
    isLocal: boolean;
    /** The name of a function */
    functionName: string;
    /** The line no of a function inside of an al object */
    lineNo: number;
    /** Parameters of a function */
    parameters: ALVariable[] = [];
    /** Variables of a function */
    variables: ALVariable[] = [];
    /** The return value of a function */
    returnValue: ALVariable | undefined = undefined;
    functionArgument: ALFunctionArgument | undefined;

    constructor(functionType: FunctionType, name: string, settings: { lineNo: number, parameters?: ALVariable[] | undefined, returnValue: ALVariable | undefined, isLocal: boolean }) {
        this.functionType = functionType;
        this.isLocal = settings.isLocal;
        this.functionName = name;
        this.lineNo = settings.lineNo;
        if (settings.parameters) { this.parameters = settings.parameters; }
        this.returnValue = settings.returnValue;
    }

    /**
     * Get the original function text from the al code
     * @returns Original function text
     */
    recreateOriginalCodeText(): string {
        let functionText = "";
        if (this.isLocal) {
            functionText += "local ";
        }

        let parameters = "";
        if (this.parameters.length > 0) {
            this.parameters.forEach(alVariable => {
                if (alVariable.isVar) {
                    parameters += "var ";
                }

                parameters += `${alVariable.variableName}: ${alVariable.dataType}`;
                if (alVariable.subType && alVariable.subType !== "") {
                    if (/\W/.test(alVariable.subType) && !alVariable.subType.startsWith("\"")) {
                        parameters += ` "${alVariable.subType}"`;
                    }
                    else {
                        parameters += ` ${alVariable.subType}`;
                    }
                }

                if (alVariable.isTemporary) {
                    parameters += " temporary";
                }

                parameters += ";";
            });

            // remove last ;
            parameters = parameters.substring(0, parameters.length - 1);
        }

        functionText += `procedure ${this.functionName}(${parameters})`;

        if (this.returnValue) {
            functionText += `: ${this.returnValue.dataType}`;
            if (this.returnValue.subType) {
                if (/\W/.test(this.returnValue.subType) && !this.returnValue.subType.startsWith("\"")) {
                    functionText += ` "${this.returnValue.subType}"`;
                }
                else {
                    functionText += ` ${this.returnValue.subType}`;
                }
            }
        }

        return functionText;
    }

    /**
     * Get the event subscriber function text for a event publisher
     * @param alObject The al object correspondig to this event
     * @returns The event subscriber text
     */
    getEventSubscriberText(alObject: ALObject): string {
        if (this.functionType === FunctionType.Standard ||
            this.functionType === FunctionType.Trigger ||
            this.functionType === FunctionType.EventSubscriber) {
            return "";
        }

        //#region Event subscriber header
        let objectName = alObject.objectName;
        let objectType = alObject.objectType;
        switch (alObject.objectType) {
            case ObjectType.TableExtension:
            case ObjectType.PageExtension:
            case ObjectType.ReportExtension:
            case ObjectType.EnumExtension:
                var parent = (alObject as ALExtension).parent;
                if (parent) {
                    objectType = parent.objectType;
                    objectName = parent.objectName;
                }
                break;
        }
        let objectTypeStr = ObjectType[objectType];

        if (objectType === ObjectType.Table) {
            objectTypeStr = "Database";
        }

        let functionHeader = `[EventSubscriber(ObjectType::${ObjectType[objectType]}, ${objectTypeStr}::"${objectName}", '${this.functionName}', '${this.functionArgument?.eventElementName}', false, false)]`;
        //#endregion

        //#region Function declaration
        let functionText = "";
        if (this.isLocal) {
            functionText += "local ";
        }

        let parameters = "";
        if (this.parameters.length > 0) {
            this.parameters.forEach(alVariable => {
                if (alVariable.isVar) {
                    parameters += "var ";
                }

                parameters += `${alVariable.variableName}: ${alVariable.dataType}`;
                if (alVariable.subType && alVariable.subType !== "") {
                    if (/\W/.test(alVariable.subType) && !alVariable.subType.startsWith("\"")) {
                        parameters += ` "${alVariable.subType}"`;
                    }
                    else {
                        parameters += ` ${alVariable.subType}`;
                    }
                }

                if (alVariable.isTemporary) {
                    parameters += " temporary";
                }

                parameters += "; ";
            });

            // remove last ;
            parameters = parameters.substring(0, parameters.length - 2);
        }

        functionText += `procedure ${objectName.replace(/\W/g, "")}_${this.functionName}`;
        if (this.functionArgument?.eventElementName !== "") { functionText += `_${this.functionArgument?.eventElementName.replace(/\W/g, "")}`; }
        functionText += `(${parameters})`;

        if (this.returnValue) {
            functionText += `: ${this.returnValue.dataType} ${this.returnValue.subType}`;
        }
        //#endregion

        let eventText = "";
        eventText += functionHeader;
        eventText += "\r\n";
        eventText += "\t" + functionText;
        eventText += "\r\n";
        eventText += "\tbegin\r\n\tend;";
        return eventText;
    }

    /**
     * Get all parameters as al variables from a string of parameters
     * @param parametersText Parameter text from the al code
     * @param lineNo The line no of the parameters
     * @returns All al variables found in the parameter text
     */
    static convertParametersText(parametersText: string, lineNo: number): ALVariable[] {
        let variables: ALVariable[] = [];
        const parameterPattern = /(var )?(\"[^\"\r\n\t]+\"|[a-z0-9\_]+)\s?\:\s([a-z\[\]0-9]+)\s?(\'[^\'\;]+\'|\"[^\"\;]+\"|of [^\"\;]+|[^\"\s\;]+|)( temporary)?(?:\;|\)|$)/gi;

        let match;
        do {
            match = parameterPattern.exec(parametersText);
            if (match) {
                const isVar: boolean = match[1] !== undefined;
                const name: string = match[2];
                const type: string = match[3];
                const subType: string = match[4];
                const isTemporary: boolean = match[5] !== undefined;
                variables.push(new ALVariable(name, type, subType, lineNo, { isTemporary: isTemporary, isVar: isVar }));
            }
        } while (match);

        return variables;
    }

    /**
     * Get the function type from a string
     * @param functionType The function type as string
     * @returns The function type
     */
    static getFunctionTypeByString(functionType: string): FunctionType | undefined {
        switch (functionType.toLowerCase()) {
            case "procedure":
                return FunctionType.Standard;
            case "trigger":
                return FunctionType.Trigger;
            case "businessevent":
                return FunctionType.BusinessEvent;
            case "integrationevent":
                return FunctionType.IntegrationEvent;
            case "eventsubscriber":
                return FunctionType.EventSubscriber;
            default:
                return undefined;
        }
    }
}