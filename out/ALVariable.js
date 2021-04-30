"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALVariable = void 0;
class ALVariable {
    constructor(name, dataType, subtype, lineNo, settings) {
        this.variableName = name;
        this.dataType = dataType;
        this.subType = subtype;
        this.lineNo = lineNo;
        this.isTemporary = settings.isTemporary;
        this.isVar = settings.isVar;
    }
    recreateOriginalCodeText() {
        let variableText = "";
        if (this.isVar) {
            variableText += "var ";
        }
        variableText += `${this.variableName}: ${this.dataType}`;
        if (this.subType && this.subType !== "") {
            if (/\W/.test(this.subType) && !this.subType.startsWith("\"")) {
                variableText += ` "${this.subType}"`;
            }
            else {
                variableText += ` ${this.subType}`;
            }
        }
        if (this.isTemporary) {
            variableText += " temporary";
        }
        return variableText;
    }
}
exports.ALVariable = ALVariable;
//# sourceMappingURL=ALVariable.js.map