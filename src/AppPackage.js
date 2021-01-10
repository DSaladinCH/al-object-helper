module.exports = class AppPackage {
    constructor(name, publisher, local = false) {
        this.name = name;
        this.publisher = publisher;
        this.local = local;
        this.processed = false;
        this.displayPackageName = this.name + " by " + this.publisher;
    }
}