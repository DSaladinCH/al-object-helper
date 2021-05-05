import * as vscode from "vscode";
import { CancellationToken, Definition, DefinitionProvider, Location, LocationLink, Position, ProviderResult, TextDocument } from "vscode";
import { ALObject, ALTable, ALVariable, HelperFunctions, Reader, variablePattern } from "../internal";
import { ObjectType } from "../ObjectType";

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
            const definition = HelperFunctions.detectDefinitionName(line, position.character);
            if (definition.parentName !== "") {
                vscode.window.showInformationMessage("Definition text: " + definition.parentName + "." + definition.definitionName);
            }
            else {
                vscode.window.showInformationMessage("Definition text: " + definition.definitionName);
            }

            if (definition.definitionName === "") {
                resolve(undefined);
                return undefined;
            }

            // Check for any definition and open it
            const message = await this.getNavigation(alObject, document, position, definition);
            if (message) {
                HelperFunctions.openUriFile(message.uri, message.lineNo);
                resolve(undefined);
                return undefined;
            }

            resolve(undefined);
            return undefined;
        });
    }

    async getNavigation(alObject: ALObject, document: TextDocument, position: Position, definition: { definitionName: string, parentName: string }): Promise<{ uri: vscode.Uri, lineNo: number } | undefined> {
        if (definition.parentName === "") {
            let message = this.navigateToGlobalVariable(alObject, document, position, definition.definitionName);
            if (message) {
                return message;
            }

            message = await this.navigateToFields(alObject, document, position, definition.definitionName);
            if (message) {
                return message;
            }

            message = this.navigateToNextFunction(alObject, document, position, definition.definitionName);
            if (message) {
                return message;
            }

            message = this.navigateToLocalFunction(alObject, document, position, definition.definitionName);
            if (message) {
                return message;
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

    navigateToGlobalVariable(alObject: ALObject, document: TextDocument, position: Position, definitionName: string): { uri: vscode.Uri, lineNo: number } | undefined {
        const alVariable = HelperFunctions.navigateToGlobalVariable(alObject, document, position, definitionName);
        if (!alVariable) {
            return undefined;
        }

        return { uri: document.uri, lineNo: alVariable.lineNo };
    }

    async navigateToFields(alObject: ALObject, document: TextDocument, position: Position, definitionName: string): Promise<{ uri: vscode.Uri, lineNo: number } | undefined> {
        const field = HelperFunctions.navigateToFields(alObject, document, position, definitionName);
        if (!field) {
            return undefined;
        }

        if (alObject.isEqual(field.alObject)) {
            return { uri: document.uri, lineNo: field.field.lineNo };
        }

        return { uri: (await HelperFunctions.getTextDocument(field.alObject)).uri, lineNo: field.field.lineNo };
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