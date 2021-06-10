import * as vscode from "vscode";
import { CancellationToken, Hover, HoverProvider, Position, ProviderResult, TextDocument } from "vscode";
import { ALObject, ALVariable, HelperFunctions, Reader } from "../internal";

export class ALHoverProvider implements HoverProvider {
    reader: Reader;

    constructor(reader: Reader) {
        this.reader = reader;
    }

    provideHover(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Hover | undefined> {
        return new Promise<Hover | undefined>(async (resolve) => {
            // Only temporary app package al files
            if (document.uri.scheme !== "alObjectHelper") {
                resolve(undefined);
                return undefined;
            }

            // Get current al object
            const alObject = HelperFunctions.getCurrentALObjectByUri(document);
            if (!alObject) {
                resolve(undefined);
                return undefined;
            }

            // Get definition name
            const line = document.lineAt(position.line).text;
            const definition = HelperFunctions.detectDefinitionName(line, position.character);

            if (definition.definitionName === "") {
                resolve(undefined);
                return undefined;
            }

            // Check for any definition and display it
            let hover = await this.getNavigation(alObject, document, position, definition);
            if (hover) {
                resolve(hover);
                return hover;
            }

            resolve(undefined);
        });
    }

    async getNavigation(alObject: ALObject, document: TextDocument, position: Position, definition: { definitionName: string, parentName: string }): Promise<vscode.Hover | undefined> {
        if (definition.parentName === "") {
            let hover = this.navigateToGlobalVariable(alObject, document, position, definition.definitionName);
            if (hover) {
                return hover;
            }

            hover = this.navigateToFields(alObject, document, position, definition.definitionName);
            if (hover) {
                return hover;
            }

            hover = this.navigateToNextFunction(alObject, document, position, definition.definitionName);
            if (hover) {
                return hover;
            }

            hover = this.navigateToLocalFunction(alObject, document, position, definition.definitionName);
            if (hover) {
                return hover;
            }
        }
        // search in parent object
        else {
            // search parent variable
            let parentALObject: ALObject | undefined;
            if (definition.parentName.toLowerCase() === "rec" || definition.parentName.toLowerCase() === "xrec") {
                parentALObject = HelperFunctions.getRecOfALObject(alObject);
            }
            else {
                let alVariable = HelperFunctions.navigateToGlobalVariable(alObject, document, position, definition.parentName);

                if (!alVariable) {
                    let next = HelperFunctions.navigateToNextLocalFunction(alObject, document, position, definition.parentName);
                    if (next instanceof ALVariable) {
                        alVariable = next as ALVariable;
                    }
                }

                if (!alVariable) {
                    return undefined;
                }

                parentALObject = HelperFunctions.getALObjectOfALVariable(alVariable);
            }

            if (!parentALObject) {
                return undefined;
            }

            const parentDocument = await HelperFunctions.getTextDocument(parentALObject);
            let result = await this.getNavigation(parentALObject, parentDocument, new Position(0, 0), { definitionName: definition.definitionName, parentName: "" });
            return result;
        }

        return undefined;
    }

    navigateToGlobalVariable(alObject: ALObject, document: TextDocument, position: Position, definitionName: string): vscode.Hover | undefined {
        const alVariable = HelperFunctions.navigateToGlobalVariable(alObject, document, position, definitionName);
        if (!alVariable) {
            return undefined;
        }

        return new vscode.Hover({ language: 'al', value: alVariable.recreateOriginalCodeText() });
    }

    navigateToFields(alObject: ALObject, document: TextDocument, position: Position, definitionName: string): vscode.Hover | undefined {
        const field = HelperFunctions.navigateToFields(alObject, document, position, definitionName);
        if (!field) {
            return undefined;
        }

        return new vscode.Hover({ language: 'al', value: field.field.getDisplayText() });
    }

    navigateToNextFunction(alObject: ALObject, document: TextDocument, position: Position, definitionName: string): vscode.Hover | undefined {
        const next = HelperFunctions.navigateToNextLocalFunction(alObject, document, position, definitionName);
        if (!next) {
            return undefined;
        }

        return new vscode.Hover({ language: 'al', value: next.recreateOriginalCodeText() });
    }

    navigateToLocalFunction(alObject: ALObject, document: TextDocument, position: Position, definitionName: string): vscode.Hover | undefined {
        const alFunction = HelperFunctions.navigateToLocalFunction(alObject, document, position, definitionName);
        if (!alFunction) {
            return undefined;
        }

        return new vscode.Hover({ language: 'al', value: alFunction.recreateOriginalCodeText() });
    }
}