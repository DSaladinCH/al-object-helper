import { ObjectType } from "../internal";

export class LicensePurchasedObject {
    objectType: ObjectType;
    objectTypeStr: string;
    noPurchased: number;
    noAssigned: number = 0;
    noOfObjects: number = 0;
    noNotInRange: number = 0;
    noOfFreeObjects: number = 0;

    constructor(objectType: ObjectType, noPurchased: number) {
        this.objectType = objectType;
        this.objectTypeStr = ObjectType[objectType];
        this.noPurchased = noPurchased;
    }
}