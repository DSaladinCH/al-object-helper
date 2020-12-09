const ALVariable = require("./ALVariable");

module.exports = class ALFunction {
    constructor(name, lineNo, line = "", local = false, eventType = "") {
        if (typeof name != "string") {
            return Object.assign(this, name);
        }

        this.name = name;
        this.lineNo = lineNo;
        this.local = local;
        this.parameters = [];
        this.eventType = eventType;

        if (line != "") {
            var r = /(var )?(\"[^\"\r\n\t]+\"|[a-z0-9\_]+)\s?\:\s([a-z\[\]0-9]+)\s?(\'[^\'\;]+\'|\"[^\"\;]+\"|of [^\"\;]+|[^\"\s\;]+|)( temporary)?(?:\;|\))/gmi;
            var match;
            while (match = r.exec(line.substring(line.indexOf(name) + name.length))) {
                var isVar = false;
                var isTemp = false;
                if (match[1] != undefined)
                    isVar = true;
                if (match[5] != undefined)
                    isTemp = true;
                this.parameters.push(new ALVariable(match[2], match[3], lineNo, true, match[4], isVar, isTemp));
            }
        }
    }

    getDisplayText(withParams = false) {
        var parameters = "";
        if (this.parameters.length != 0 && withParams) {
            for (let index = 0; index < this.parameters.length; index++) {
                const element = this.parameters[index];
                if (element.isVar)
                    parameters += "var ";
                parameters += `${element.name}: ${element.type}`;
                if (element.subType != "") {
                    if (element.subType.startsWith("\""))
                        parameters += " " + element.subType;
                    else
                        parameters += ` "${element.subType}"`;
                }
                if (element.isTemp)
                    parameters += " temporary";
                if (index < this.parameters.length - 1)
                    parameters += "; ";
            }
        }
        if (this.eventType != "")
            return `[${this.eventType}]\nprocedure ${this.name}(${parameters})`;
        return `procedure ${this.name}(${parameters})`;
    }
}