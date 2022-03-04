import { LicenseCheckObject, LicensePurchasedObject } from "../internal";

export class LicenseCheckInfo {
    noOutOfRange: number;
    noFreeObjects: number;
    licenseCheckObjects: LicenseCheckObject[];
    purchasedObjects: LicensePurchasedObject[];

    constructor(purchasedObjects: LicensePurchasedObject[], licenseCheckObjects: LicenseCheckObject[], noFreeObjects: number) {
        this.noOutOfRange = licenseCheckObjects.length;
        this.noFreeObjects = noFreeObjects;
        this.licenseCheckObjects = licenseCheckObjects;
        this.purchasedObjects = purchasedObjects;
    }

    static getJson(purchasedObjects: LicensePurchasedObject[], licenseCheckObjects: LicenseCheckObject[], noFreeObjects: number): string {
        return JSON.stringify(new LicenseCheckInfo(purchasedObjects, licenseCheckObjects, noFreeObjects));
    }
}