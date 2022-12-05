import { ALObject, AppType } from './internal';
import os = require('os');

export class ALApp {
    appType: AppType;
    appName: string;
    appPublisher: string;
    appVersion: string;
    appRunTimeVersion: string;
    appRootPath: string;
    appDate: Date;
    appChanged: boolean = true;
    showMyCode: boolean = true;
    private _alObjects: ALObject[] = [];

    get alObjects() {
        return this._alObjects;
    }

    /**
     * Create a new app
     * @param appType The internal app type
     * @param name The name of this app
     * @param publisher The publisher of this app
     * @param alRunTimeVersion The runtime version of this app
     * @param appPath The path to this app (project path or app path)
     */
    constructor(appType: AppType, name: string, publisher: string, version: string, alRunTimeVersion: string, appPath: string, appDate: Date, showMyCode: boolean) {
        this.appType = appType;
        this.appName = name.trim();
        this.appPublisher = publisher.trim();
        this.appVersion = version;
        this.appRunTimeVersion = alRunTimeVersion.trim();
        this.appRootPath = appPath;

        if (!this.appRootPath.endsWith(".app")) {
            if (os.type() == "Windows_NT") {
                if (!this.appRootPath.endsWith("\\")) {
                    this.appRootPath += "\\";
                }
            }
            else {
                if (!this.appRootPath.endsWith("/")) {
                    this.appRootPath += "/";
                }
            }
        }

        this.appDate = appDate;
        this.showMyCode = showMyCode;
    }

    static Empty(): ALApp {
        return new ALApp(AppType.appPackage, '', '', '', '', '', new Date(), true);
    }

    /**
     * Add a al object to a app
     * @param newAlObject The al object which should be added
     */
    addObject(newAlObject: ALObject) {
        var index = this._alObjects.findIndex(alObject => alObject.objectType === newAlObject.objectType && alObject.objectID === newAlObject.objectID &&
            alObject.alApp.appName === newAlObject.alApp.appName);

        // if the object already exists, update it
        if (index !== -1) {
            this._alObjects[index] = newAlObject;
            return;
        }

        this._alObjects.push(newAlObject);
    }

    /**
     * Add multiple al objects to a app
     * @param newAlObjects The al objects which should be added
     */
    addObjects(newAlObjects: ALObject[]) {
        for (let i = 0; i < newAlObjects.length; i++) {
            this.addObject(newAlObjects[i]);
        }
        // this._alObjects = this.alObjects.concat(newAlObjects);
    }

    /**
     * Remove all al objects of a app
     */
    clearALObjects() {
        this._alObjects = [];
    }
}