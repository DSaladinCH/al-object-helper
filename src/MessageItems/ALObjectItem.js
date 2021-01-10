module.exports = class ALObjectItem {
    constructor(alObject, showPackageName = true) {
        if (typeof alObject === 'string' || alObject instanceof String) {
            this.label = alObject;
            this.alwaysShow = true;
            return;
        }

        this.userInputField = false;
        this.label = alObject.name;
        this.description = alObject.displayType + " " + alObject.id;
        this.shortType = alObject.shortType;
        this.type = alObject.type;
        this.id = alObject.id;
        this.extension = alObject.extension;
        this.appPackageName = alObject.appPackageName;

        var packageName = "";
        var splittedName = alObject.appPackageName.split('_');
        if (splittedName.length > 1)
            packageName += splittedName[1] + " by ";
        if (splittedName.length > 0)
            packageName += splittedName[0];

        // alObject.appPackageName.split('_').forEach(element => {
        //     packageName += element + " ";
        // });

        packageName = packageName.trim();

        if (showPackageName)
            this.detail = packageName;

        if (alObject.extension) {
            if (alObject.extendsID == -1)
                this.description += " - Extends " + alObject.extendsName;
            else
                this.description += " - Extends " + alObject.displayExtendsType + " " + alObject.extendsID + " - " + alObject.extendsName;
        }
        if (alObject.shortType == "r" && alObject.secondPath != "") {
            this.detail += "(Includes RDLC Layout)";
        }
    }

    static convertToALObjectItem(obj) {
        return Object.assign(this, obj);
    }
}