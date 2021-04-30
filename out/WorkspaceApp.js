"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALApp = void 0;
const path = require("path");
class ALApp {
    constructor(name, publisher, alRunTimeVersion, workspacePath) {
        this.appName = name.trim();
        this.appPublisher = publisher;
        this.appRunTimeVersion = alRunTimeVersion.trim();
        this.appPath = workspacePath;
        this.appJsonPath = path.join(workspacePath, 'app.json');
        this.alPackagesPath = path.join(workspacePath, '.alpackages');
    }
}
exports.ALApp = ALApp;
//# sourceMappingURL=WorkspaceApp.js.map