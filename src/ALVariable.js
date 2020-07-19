module.exports = class ALVariable {
    constructor(name, type, lineNo, local, subType = "") {
        this.name = name;
        this.type = type;
        this.lineNo = lineNo;
        this.subType = subType;
        this.local = local;
    }
}