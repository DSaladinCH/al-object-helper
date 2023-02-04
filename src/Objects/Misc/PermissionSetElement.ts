import { PermissionObjectType, PermissionValue } from "../../internal";

export class PermissionSetElement {
    objectType: PermissionObjectType;
    readPermission: PermissionValue = PermissionValue.None;
    insertPermission: PermissionValue = PermissionValue.None;
    modifyPermission: PermissionValue = PermissionValue.None;
    deletePermission: PermissionValue = PermissionValue.None;
    executePermission: PermissionValue = PermissionValue.None;
    // if 0, every object of this type is included (*)
    id: number;
    name: string = "";

    constructor(permissionObject: number, value: number, id: number) {
        this.objectType = permissionObject;
        this.convertValueToBooleans(value);
        this.id = id;
    }

    convertValueToBooleans(value: number) {
        if (this.isBitEnabled(value, 1))
            this.readPermission = PermissionValue.Direct;

        if (this.isBitEnabled(value, 2))
            this.insertPermission = PermissionValue.Direct;

        if (this.isBitEnabled(value, 4))
            this.modifyPermission = PermissionValue.Direct;

        if (this.isBitEnabled(value, 8))
            this.deletePermission = PermissionValue.Direct;

        if (this.isBitEnabled(value, 16))
            this.executePermission = PermissionValue.Direct;

        if (this.isBitEnabled(value, 32))
            this.readPermission = PermissionValue.Indirect;

        if (this.isBitEnabled(value, 64))
            this.insertPermission = PermissionValue.Indirect;

        if (this.isBitEnabled(value, 128))
            this.modifyPermission = PermissionValue.Indirect;

        if (this.isBitEnabled(value, 256))
            this.deletePermission = PermissionValue.Indirect;

        if (this.isBitEnabled(value, 512))
            this.executePermission = PermissionValue.Indirect;
    }

    isBitEnabled(value: number, checkBit: number): boolean {
        return !!(value & checkBit);
    }

    getPermissionText() {
        var permissionText = "";

        permissionText += this.getPermissionCase("R", this.readPermission);
        permissionText += this.getPermissionCase("I", this.insertPermission);
        permissionText += this.getPermissionCase("M", this.modifyPermission);
        permissionText += this.getPermissionCase("D", this.deletePermission);
        permissionText += this.getPermissionCase("X", this.executePermission);

        return permissionText;
    }

    private getPermissionCase(character: string, value: PermissionValue) {
        if (value === PermissionValue.Direct)
            return character.toUpperCase();

        if (value === PermissionValue.Indirect)
            return character.toLowerCase();

        return "";
    }
}