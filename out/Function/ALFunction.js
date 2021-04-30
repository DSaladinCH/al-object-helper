"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALFunction = void 0;
const internal_1 = require("../internal");
class ALFunction {
    constructor(functionType, name, settings) {
        this.parameters = [];
        this.variables = [];
        this.returnValue = undefined;
        this.elementName = "";
        this.functionType = functionType;
        this.isLocal = settings.isLocal;
        this.functionName = name;
        this.lineNo = settings.lineNo;
        if (settings.parameters) {
            this.parameters = settings.parameters;
        }
        if (settings.elementName) {
            this.elementName = settings.elementName;
        }
        this.returnValue = settings.returnValue;
    }
    recreateOriginalCodeText() {
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
    getEventSubscriberText(alObject) {
        // if (this.functionType === FunctionType.InternalEvent ||
        //     this.functionType === FunctionType.BusinessEvent ||
        //     this.functionType === FunctionType.IntegrationEvent) {
        //     return "";
        // }
        //#region Event subscriber header
        let objectName = alObject.objectName;
        let objectType = alObject.objectType;
        switch (alObject.objectType) {
            case internal_1.ObjectType.TableExtension:
            case internal_1.ObjectType.PageExtension:
            case internal_1.ObjectType.ReportExtension:
            case internal_1.ObjectType.EnumExtension:
                var parent = alObject.parent;
                if (parent) {
                    objectType = parent.objectType;
                    objectName = parent.objectName;
                }
                break;
        }
        let objectTypeStr = internal_1.ObjectType[objectType];
        if (objectType === internal_1.ObjectType.Table) {
            objectTypeStr = "Database";
        }
        let functionHeader = `[EventSubscriber(ObjectType::${internal_1.ObjectType[objectType]}, ${objectTypeStr}::"${objectName}", '${this.functionName}', '${this.elementName}', false, false)]`;
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
        if (this.elementName !== "") {
            functionText += `_${this.elementName.replace(/\W/g, "")}`;
        }
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
    static convertParametersText(parametersText, lineNo) {
        let variables = [];
        const parameterPattern = /(var )?(\"[^\"\r\n\t]+\"|[a-z0-9\_]+)\s?\:\s([a-z\[\]0-9]+)\s?(\'[^\'\;]+\'|\"[^\"\;]+\"|of [^\"\;]+|[^\"\s\;]+|)( temporary)?(?:\;|\)|$)/gi;
        let match;
        do {
            match = parameterPattern.exec(parametersText);
            if (match) {
                const isVar = match[1] !== undefined;
                const name = match[2];
                const type = match[3];
                const subType = match[4];
                const isTemporary = match[5] !== undefined;
                variables.push(new internal_1.ALVariable(name, type, subType, lineNo, { isTemporary: isTemporary, isVar: isVar }));
            }
        } while (match);
        return variables;
    }
}
exports.ALFunction = ALFunction;
//# sourceMappingURL=ALFunction.js.map