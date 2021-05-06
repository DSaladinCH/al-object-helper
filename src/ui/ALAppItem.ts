import { ALApp } from "../internal";

export class ALAppItem {
    label: string;
    description: string = "";
    detail: string = "";
    alApp: ALApp;

    constructor(alApp: ALApp) {
        this.label = alApp.appName;
        this.description = alApp.appPublisher;
        this.detail = alApp.appVersion;
        this.alApp = alApp;
    }
}