const ALVariable = require("./ALVariable");

module.exports = class ALFunction {
    constructor(name, lineNo, line = "", local = false) {
        this.name = name;
        this.lineNo = lineNo;
        this.local = local;
        this.parameters = [];

        if (line != "") {
            var r = /(var )?(\"[^\"\r\n\t]+\"|[a-z0-9\_]+)\s?\:\s([a-z\[\]0-9]+)\s?(\'[^\'\;]+\'|\"[^\"\;]+\"|of [^\"\;]+|[^\"\s\;]+|)(?:\;|\))/gmi;
            var match;
            while (match = r.exec(line.substring(line.indexOf(name) + name.length))) {
                var isVar = false;
                if (match[1] != undefined)
                    isVar = true;
                this.parameters.push(new ALVariable(match[2], match[3], lineNo, true, match[4], isVar));
            }
        }
    }
}