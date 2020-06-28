module.exports = class AppPackageItem {
    constructor(name, displayName) {
        this.label = displayName;
        this.packageName = name;
    }

    static convertToAppPackageItem(obj) {
        return Object.assign(this, obj);
    }
}