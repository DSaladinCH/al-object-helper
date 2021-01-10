const path = require("path");

module.exports = class WorkspaceApp {
    constructor(name, publisher, alRunTimeVersion, workspacePath) {
        if (typeof workspacePath != "string")
            return;
        this.name = name.trim();
        this.publisher = publisher;
        this.alRunTimeVersion = alRunTimeVersion.trim();
        this.workspacePath = workspacePath;
        this.appJsonPath = path.join(workspacePath, 'app.json');
        this.alPackagesPath = path.join(workspacePath, '.alpackages');
    }
}