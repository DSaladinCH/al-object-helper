module.exports = class ALTableField {
    constructor(id, name, type, lineNo) {
        this.id = id;
        // if (name.startsWith("\"")){
        //     name = name.substring(1);
        //     name = name.substring(0, name.length - 1);
        // }
        this.name = name;
        this.type = type;
        this.lineNo = lineNo;
    }
}