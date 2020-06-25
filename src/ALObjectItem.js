module.exports = class MessageItem {
    constructor(alObject) {
        this.label = alObject.name;
        this.description = alObject.displayType + " " + alObject.id;
        this.shortType = alObject.shortType;
        this.id = alObject.id;
        //this.detail = alObject.displayType + " " + alObject.id;
    }

    static getALObjectItem(alObject) {
        return new MessageItem(alObject);
    }

    static convertToALObjectItem(obj){
        return Object.assign(this, obj);
    }
}