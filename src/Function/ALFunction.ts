import { ALExtension, ALObject, ALPageExtension, ALReportExtension, ALTableExtension, ALVariable, FunctionType, ObjectType } from "../internal";

export class ALFunction {
    functionType: FunctionType;
    isLocal: boolean;
    functionName: string;
    lineNo: number;
    parameters: ALVariable[] = [];
    variables: ALVariable[] = [];
    returnValue: ALVariable | undefined = undefined;
    elementName: string = "";

    constructor(functionType: FunctionType, name: string, settings: { lineNo: number, parameters?: ALVariable[] | undefined, returnValue: ALVariable | undefined, isLocal: boolean, elementName?: string }) {
        this.functionType = functionType;
        this.isLocal = settings.isLocal;
        this.functionName = name;
        this.lineNo = settings.lineNo;
        if (settings.parameters) { this.parameters = settings.parameters; }
        if (settings.elementName) { this.elementName = settings.elementName; }
        this.returnValue = settings.returnValue;
    }

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

    getEventSubscriberText(alObject: ALObject): string {
        // if (this.functionType === FunctionType.InternalEvent ||
        //     this.functionType === FunctionType.BusinessEvent ||
        //     this.functionType === FunctionType.IntegrationEvent) {
        //     return "";
        // }

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

        let functionHeader = `[EventSubscriber(ObjectType::${ObjectType[objectType]}, ${objectTypeStr}::"${objectName}", '${this.functionName}', '${this.elementName}', false, false)]`;
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

                parameters += ";";
            });

            // remove last ;
            parameters = parameters.substring(0, parameters.length - 1);
        }

        functionText += `procedure ${objectName.replace(/\W/g, "")}_${this.functionName}`;
        if (this.elementName !== "") { functionText += `_${this.elementName.replace(/\W/g, "")}`; }
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
}