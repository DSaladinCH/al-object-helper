export class ALVariable {
    variableName: string;
    dataType: string;
    subType: string;
    isTemporary: boolean;
    isVar: boolean;
    lineNo: number;

    constructor(name: string, dataType: string, subtype: string, lineNo: number, settings: { isTemporary: boolean, isVar: boolean }) {
        this.variableName = name;
        this.dataType = dataType;
        this.subType = subtype;
        this.lineNo = lineNo;
        this.isTemporary = settings.isTemporary;
        this.isVar = settings.isVar;
    }

    recreateOriginalCodeText(): string {
        let variableText = "";
        if (this.isVar){
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

        if (this.isTemporary){
            variableText += " temporary";
        }

        return variableText;
    }
}