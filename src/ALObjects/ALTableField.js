module.exports = class ALTableField {
    constructor(id, name, type, lineNo) {
        if (typeof id != "string") {
            return Object.assign(this, id);
        }

        this.id = id;
        this.name = name;
        this.type = type;
        this.lineNo = lineNo;
    }
}