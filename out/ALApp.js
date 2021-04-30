"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALApp = void 0;
const internal_1 = require("./internal");
class ALApp {
    /**
     * Create a new app
     * @param appType The internal app type
     * @param name The name of this app
     * @param publisher The publisher of this app
     * @param alRunTimeVersion The runtime version of this app
     * @param appPath The path to this app (project path or app path)
     */
    constructor(appType, name, publisher, alRunTimeVersion, appPath) {
        this._alObjects = [];
        this.appType = appType;
        this.appName = name.trim();
        this.appPublisher = publisher.trim();
        this.appRunTimeVersion = alRunTimeVersion.trim();
        this.appPath = appPath;
        if (!this.appPath.endsWith(".app")) {
            if (!this.appPath.endsWith("\\")) {
                this.appPath += "\\";
            }
        }
    }
    get alObjects() {
        return this._alObjects;
    }
    static Empty() {
        return new ALApp(internal_1.AppType.appPackage, '', '', '', '');
    }
    /**
     * Add a al object to a app
     * @param newAlObject The al object which should be added
     */
    addObject(newAlObject) {
        this.alObjects.push(newAlObject);
    }
    /**
     * Add multiple al objects to a app
     * @param newAlObjects The al objects which should be added
     */
    addObjects(newAlObjects) {
        this._alObjects = this.alObjects.concat(newAlObjects);
    }
}
exports.ALApp = ALApp;
//# sourceMappingURL=ALApp.js.map