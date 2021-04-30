import * as vscode from "vscode";
import { CancellationToken, Definition, DefinitionProvider, Location, LocationLink, Position, ProviderResult, TextDocument } from "vscode";
import { ALObject, HelperFunctions, Reader } from "../internal";

export class ALDefinitionProvider implements DefinitionProvider {
    reader: Reader;

    constructor(reader: Reader) {
        this.reader = reader;
    }

    provideDefinition(document: TextDocument, position: Position, token: CancellationToken): Promise<Definition | LocationLink[] | undefined> {
        return new Promise<Definition | LocationLink[] | undefined>(async (resolve) => {
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

            // Check for any definition and open it
            const message = this.getNavigation(alObject, document, position, definitionName);
            if (message) {
                HelperFunctions.openUriFile(message.uri, message.lineNo);
                resolve(undefined);
                return undefined;
            }

            resolve(undefined);
            return undefined;
        });
    }

    getNavigation(alObject: ALObject, document: TextDocument, position: Position, definitionName: string): { uri: vscode.Uri, lineNo: number } | undefined {
        let message = this.navigateToGlobalVariable(alObject, document, position, definitionName);
        if (message) {
            return message;
        }

        message = this.navigateToFields(alObject, document, position, definitionName);
        if (message) {
            return message;
        }

        message = this.navigateToNextFunction(alObject, document, position, definitionName);
        if (message) {
            return message;
        }

        message = this.navigateToLocalFunction(alObject, document, position, definitionName);
        if (message) {
            return message;
        }

        return undefined;
    }

    navigateToGlobalVariable(alObject: ALObject, document: TextDocument, position: Position, definitionName: string): { uri: vscode.Uri, lineNo: number } | undefined {
        const alVariable = HelperFunctions.navigateToGlobalVariable(alObject, document, position, definitionName);
        if (!alVariable) {
            return undefined;
        }

        return { uri: document.uri, lineNo: alVariable.lineNo };
    }

    navigateToFields(alObject: ALObject, document: TextDocument, position: Position, definitionName: string): { uri: vscode.Uri, lineNo: number } | undefined{
        const field = HelperFunctions.navigateToFields(alObject, document, position, definitionName);
        if (!field) {
            return undefined;
        }

        return { uri: document.uri, lineNo: field.lineNo };
    }

    navigateToNextFunction(alObject: ALObject, document: TextDocument, position: Position, definitionName: string): { uri: vscode.Uri, lineNo: number } | undefined {
        const next = HelperFunctions.navigateToNextLocalFunction(alObject, document, position, definitionName);
        if (!next) {
            return undefined;
        }

        return { uri: document.uri, lineNo: next.lineNo };
    }

    navigateToLocalFunction(alObject: ALObject, document: TextDocument, position: Position, definitionName: string): { uri: vscode.Uri, lineNo: number } | undefined {
        const alFunction = HelperFunctions.navigateToLocalFunction(alObject, document, position, definitionName);
        if (!alFunction) {
            return undefined;
        }

        return { uri: document.uri, lineNo: alFunction.lineNo };
    }
}