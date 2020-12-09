module.exports = class ALVariable {
    constructor(name, type, lineNo, local, subType = "", isVar = false, isTemp = false) {
        if (typeof name != "string") {
            return Object.assign(this, name);
        }

        this.name = name;
        this.type = type;
        this.lineNo = lineNo;
        this.subType = subType;
        this.local = local;
        this.isVar = isVar;
        this.isTemp = isTemp;
    }

    getDisplayText(withRecordFields = false, alObject = undefined) {
        var displayContent = "";
        if (withRecordFields && this.type == "Record" && alObject != undefined) {
            if (alObject.type == "table" && alObject.fields.length > 0) {
                let objName = alObject.name;
                if (objName.includes(" "))
                    objName = `"${objName}"`;

                if (!this.local)
                    displayContent = `(global) ${this.name}: Record ${objName}`;
                else
                    displayContent = `(local) ${this.name}: Record ${objName}`;

                for (let index = 0; index < alObject.fields.length; index++) {
                    const element = alObject.fields[index];
                    displayContent += "\n";
                    displayContent += element.id;
                    displayContent += " - ";
                    displayContent += element.name;
                    for (let index = element.name.length + element.id.length + 3; index < 50; index++) {
                        displayContent += " ";
                    }
                    displayContent += element.type;
                }

                return displayContent;
            }
        }

        displayContent = `${this.name}: ${this.type}`;
        if (this.subType != "") {
            if (this.subType.startsWith("\""))
                displayContent += ` ${this.subType}`;
            else
                displayContent += ` "${this.subType}"`;
        }

        return displayContent;
    }
}