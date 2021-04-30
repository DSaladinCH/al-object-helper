import * as path from 'path';
import { ALObject, AppType } from './internal';

export class ALApp {
    appType: AppType;
    appName: string;
    appPublisher: string;
    appRunTimeVersion: string;
    appPath: string;
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
    constructor(appType: AppType, name: string, publisher: string, alRunTimeVersion: string, appPath: string) {
        this.appType = appType;
        this.appName = name.trim();
        this.appPublisher = publisher.trim();
        this.appRunTimeVersion = alRunTimeVersion.trim();
        this.appPath = appPath;
        if (!this.appPath.endsWith(".app")){
            if (!this.appPath.endsWith("\\")){
                this.appPath += "\\";
            }
        }
    }

    static Empty(): ALApp{
        return new ALApp(AppType.appPackage, '', '', '', '');
    }

    /**
     * Add a al object to a app
     * @param newAlObject The al object which should be added
     */
    addObject(newAlObject: ALObject){
        this.alObjects.push(newAlObject);
    }

    /**
     * Add multiple al objects to a app
     * @param newAlObjects The al objects which should be added
     */
    addObjects(newAlObjects: ALObject[]){
        this._alObjects = this.alObjects.concat(newAlObjects);
    }
}