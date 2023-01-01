import { ALVariable, PageControlKind } from "../../internal";

export class ALPageControl {
    kind: PageControlKind;
    id: string;
    name: string;
    sourceExpression: string | undefined;
    properties: Map<string, string> = new Map<string, string>();
    subControls: ALPageControl[] = [];

    constructor(kind: PageControlKind, id: string, name: string) {
        this.kind = kind;
        this.id = id;
        this.name = name;
    }

    setProperties(properties: Map<string, string>) {
        this.sourceExpression = properties.get("SourceExpression")!;
        properties.delete("SourceExpression");

        if (properties.has("ApplicationArea")) {
            var applicationArea = properties.get("ApplicationArea")!;
            applicationArea = applicationArea.replaceAll("#", "");
            applicationArea = applicationArea.replaceAll(",", ", ");
            properties.set("ApplicationArea", applicationArea);
        }

        this.properties = properties;
    }
}