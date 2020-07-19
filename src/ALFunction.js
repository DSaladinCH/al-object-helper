module.exports = class ALFunction {
    constructor(name, lineNo, local = false) {
        this.name = name;
        this.lineNo = lineNo;
        this.local = local;
    }
}