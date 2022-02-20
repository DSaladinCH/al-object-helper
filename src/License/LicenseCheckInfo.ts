import { LicenseCheckObject } from "../internal";

export class LicenseCheckInfo {
    noOutOfRange: number;
    noFreeObjects: number;
    licenseCheckObjects: LicenseCheckObject[];

    constructor(licenseCheckObjects: LicenseCheckObject[], noFreeObjects: number) {
        this.noOutOfRange = licenseCheckObjects.length;
        this.noFreeObjects = noFreeObjects;
        this.licenseCheckObjects = licenseCheckObjects;
    }

    static getJson(licenseCheckObjects: LicenseCheckObject[], noFreeObjects: number): string {
        return JSON.stringify(new LicenseCheckInfo(licenseCheckObjects, noFreeObjects));
    }
}