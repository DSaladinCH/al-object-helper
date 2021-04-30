import * as vscode from "vscode";
import { CancellationToken, Hover, HoverProvider, Position, ProviderResult, TextDocument } from "vscode";
import { ALObject, HelperFunctions, Reader } from "../internal";

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
            const definitionName = HelperFunctions.detectDefinitionName(line, position.character);
            vscode.window.showInformationMessage("Definition text: " + definitionName);

            if (definitionName === "") {
                resolve(undefined);
                return undefined;
            }

            // Check for any definition and display it
            let hover = this.getNavigation(alObject, document, position, definitionName);
            if (hover) {
                resolve(hover);
                return hover;
            }

            resolve(undefined);
        });
    }

    getNavigation(alObject: ALObject, document: TextDocument, position: Position, definitionName: string): vscode.Hover | undefined {
        let hover = this.navigateToGlobalVariable(alObject, document, position, definitionName);
        if (hover) {
            return hover;
        }

        hover = this.navigateToFields(alObject, document, position, definitionName);
        if (hover) {
            return hover;
        }

        hover = this.navigateToNextFunction(alObject, document, position, definitionName);
        if (hover) {
            return hover;
        }

        hover = this.navigateToLocalFunction(alObject, document, position, definitionName);
        if (hover) {
            return hover;
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

        return new vscode.Hover({ language: 'al', value: field.getDisplayText() });
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