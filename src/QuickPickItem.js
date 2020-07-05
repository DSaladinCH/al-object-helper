module.exports = class QuickPickItem {
    constructor(label, description = "", detail = "") {
        this.label = label;
        this.description = description;
        this.detail = detail;
    }

    static convertToAppPackageItem(obj) {
        return Object.assign(this, obj);
    }
}