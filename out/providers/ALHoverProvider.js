"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALHoverProvider = void 0;
const vscode = require("vscode");
const internal_1 = require("../internal");
class ALHoverProvider {
    constructor(reader) {
        this.reader = reader;
    }
    provideHover(document, position, token) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            // Only temporary app package al files
            if (document.uri.scheme !== "alObjectHelper") {
                resolve(undefined);
                return undefined;
            }
            // Get current al object
            const alObject = internal_1.HelperFunctions.getCurrentALObjectByUri(document);
            if (!alObject) {
                resolve(undefined);
                return undefined;
            }
            // Get definition name
            const line = document.lineAt(position.line).text;
            const definitionName = internal_1.HelperFunctions.detectDefinitionName(line, position.character);
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
        }));
    }
    getNavigation(alObject, document, position, definitionName) {
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
    navigateToGlobalVariable(alObject, document, position, definitionName) {
        const alVariable = internal_1.HelperFunctions.navigateToGlobalVariable(alObject, document, position, definitionName);
        if (!alVariable) {
            return undefined;
        }
        return new vscode.Hover({ language: 'al', value: alVariable.recreateOriginalCodeText() });
    }
    navigateToFields(alObject, document, position, definitionName) {
        const field = internal_1.HelperFunctions.navigateToFields(alObject, document, position, definitionName);
        if (!field) {
            return undefined;
        }
        return new vscode.Hover({ language: 'al', value: field.getDisplayText() });
    }
    navigateToNextFunction(alObject, document, position, definitionName) {
        const next = internal_1.HelperFunctions.navigateToNextLocalFunction(alObject, document, position, definitionName);
        if (!next) {
            return undefined;
        }
        return new vscode.Hover({ language: 'al', value: next.recreateOriginalCodeText() });
    }
    navigateToLocalFunction(alObject, document, position, definitionName) {
        const alFunction = internal_1.HelperFunctions.navigateToLocalFunction(alObject, document, position, definitionName);
        if (!alFunction) {
            return undefined;
        }
        return new vscode.Hover({ language: 'al', value: alFunction.recreateOriginalCodeText() });
    }
}
exports.ALHoverProvider = ALHoverProvider;
//# sourceMappingURL=ALHoverProvider.js.map