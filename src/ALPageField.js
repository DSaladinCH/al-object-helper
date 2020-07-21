module.exports = class ALPageField {
    constructor(name, fieldName, lineNo) {
        // if (name.startsWith("\"")){
        //     name = name.substring(1);
        //     name = name.substring(0, name.length - 1);
        // }
        this.name = name;
        
        // if (fieldName.startsWith("\"")){
        //     fieldName = fieldName.substring(1);
        //     fieldName = fieldName.substring(0, fieldName.length - 1);
        // }
        this.fieldName = fieldName;
        this.lineNo = lineNo;
    }
}