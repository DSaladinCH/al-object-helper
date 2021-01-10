module.exports = class AppPackageItem {
    constructor(name, publisher, displayName) {
        this.label = displayName;
        this.appName = name;
        this.publisher = publisher;
    }

    static convertToAppPackageItem(obj) {
        return Object.assign(this, obj);
    }
}