module.exports = class ALPageField {
    constructor(name, fieldName, lineNo) {
        if (typeof name != "string") {
            return Object.assign(this, name);
        }

        this.name = name;
        this.fieldName = fieldName;
        this.lineNo = lineNo;
    }
}