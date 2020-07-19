module.exports = class ALObject {
    constructor(path, type, id, name, extendsName, secondPath = '') {
        this.path = path;
        this.secondPath = secondPath;
        this.type = type.trim();
        this.displayType = this.type[0].toUpperCase() + this.type.substring(1);
        if (this.displayType.indexOf("extension") > 0)
            this.displayType = this.displayType.replace("extension", "Extension");
        this.shortType = this.convertToShortType(this.type);
        this.id = id;
        this.name = name.trim();

        this.extendsName = extendsName.trim();
        this.extendsID = -1;
        this.extendsType = "";
        this.displayExtendsType = "";

        this.appPackageName = "";
        this.pageSourceTable = "";

        this.eventPublisher = [];
        this.eventSubscriber = [];

        this.functions = [];
        this.variables = [];

        if (this.extendsName == '')
            this.extension = false;
        else {
            this.extension = true;
            this.extendsType = this.type.substring(0, this.type.indexOf("extension")).trim();
        }
    }

    setExtendObject(id, type) {
        this.extendsID = id;
        this.extendsType = type.trim();
        this.displayExtendsType = this.extendsType[0].toUpperCase() + this.extendsType.substring(1);
    }

    convertToShortType(type) {
        switch (type) {
            case "table":
                return "t";
            case "page":
                return "p";
            case "codeunit":
                return "c";
            case "report":
                return "r";
            case "xmlport":
                return "x";
            case "enum":
                return "e";
            case "tableextension":
                return "te";
            case "pageextension":
                return "pe";
            case "enumextension":
                return "ee";
            case "reportlayout":
                return "rl";
        }
    }
}