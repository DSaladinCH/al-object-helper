import { ALTable, HelperFunctions } from "../internal";

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

        if (this.dataType.toLowerCase() === "record") {
            // include all fields of the table
            const alObject = HelperFunctions.getALObjectOfALVariable(this);
            if (alObject) {
                let alFields = (alObject as ALTable).getAllFields();
                alFields.forEach(alField => {
                    variableText += "\r\n";
                    variableText += alField.getDisplayText(true);
                });
            }
        }

        return variableText;
    }
}