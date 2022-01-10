import { LicenseObject } from "../internal";

export class LicenseInformation {
    customerName: string;
    productVersion: string;
    expiryDate: string;
    licenseObjects: LicenseObject[] = [];

    constructor(customerName: string, productVersion: string, expiryDate: string) {
        this.customerName = customerName;
        this.productVersion = productVersion;
        this.expiryDate = expiryDate;
    }
}