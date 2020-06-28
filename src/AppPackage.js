module.exports = class AppPackage {
    constructor(packageName) {
        if (packageName.toLowerCase() == 'custom') {
            this.packageName = 'Custom';
            this.displayPackageName = "Custom";
            return;
        }

        this.packageName = packageName;
        this.displayPackageName = "";

        this.packageName.split('_').forEach(element => {
            this.displayPackageName += element + " ";
        });

        this.displayPackageName = this.displayPackageName.trim();
    }
}