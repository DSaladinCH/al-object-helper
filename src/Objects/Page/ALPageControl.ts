import { ALVariable, HelperFunctions, PageControlChangeKind, PageControlKind } from "../../internal";

export class ALPageControl {
    kind: PageControlKind;
    changeKind: PageControlChangeKind;
    id: string;
    name: string;
    sourceExpression: string | undefined;
    properties: Map<string, string> = new Map<string, string>();
    subControls: ALPageControl[] = [];

    private constructor(kind: PageControlKind, changeKid: PageControlChangeKind, id: string, name: string) {
        this.kind = kind;
        this.changeKind = changeKid;
        this.id = id;
        this.name = name;
    }

    static pageControl(kind: PageControlKind, id: string, name: string): ALPageControl{
        return new ALPageControl(kind, PageControlChangeKind.None, id, name);
    }

    static pageExtensionControl(kind: PageControlChangeKind, id: string, name: string): ALPageControl{
        return new ALPageControl(PageControlKind.None, kind, id, name);
    }

    setProperties(properties: Map<string, string>) {
        this.sourceExpression = properties.get("SourceExpression")!;
        properties.delete("SourceExpression");

        this.properties = HelperFunctions.fixProperties(properties);
    }
}