import { HelperFunctions, PageActionChangeKind } from "../../internal";
import { PageActionKind } from "./Kinds/PageActionKind";

export class ALPageAction {
    kind: PageActionKind;
    changeKind: PageActionChangeKind;
    id: string;
    name: string;
    sourceExpression: string | undefined;
    properties: Map<string, string> = new Map<string, string>();
    actions: ALPageAction[] = [];

    private constructor(kind: PageActionKind, changeKid: PageActionChangeKind, id: string, name: string) {
        this.kind = kind;
        this.changeKind = changeKid;
        this.id = id;
        this.name = name;
    }

    static pageAction(kind: PageActionKind, id: string, name: string): ALPageAction{
        return new ALPageAction(kind, PageActionChangeKind.None, id, name);
    }

    static pageExtensionAction(kind: PageActionChangeKind, id: string, name: string): ALPageAction{
        return new ALPageAction(PageActionKind.None, kind, id, name);
    }

    setProperties(properties: Map<string, string>) {
        this.sourceExpression = properties.get("SourceExpression")!;
        properties.delete("SourceExpression");

        this.properties = HelperFunctions.fixProperties(properties);
    }
}