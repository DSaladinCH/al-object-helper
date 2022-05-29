import { LicenseObject, LicensePurchasedObject } from "../internal";

export class LicenseInformation {
    customerName: string;
    productVersion: string;
    expiryDate: string;
    licenseObjects: LicenseObject[] = [];
    purchasedObjects: LicensePurchasedObject[] = [];

    constructor(customerName: string, productVersion: string, expiryDate: string) {
        this.customerName = customerName;
        this.productVersion = productVersion;
        this.expiryDate = expiryDate;
    }
}