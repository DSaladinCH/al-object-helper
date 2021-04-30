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
exports.ALDefinitionProvider = void 0;
const vscode = require("vscode");
const internal_1 = require("../internal");
class ALDefinitionProvider {
    constructor(reader) {
        this.reader = reader;
    }
    provideDefinition(document, position, token) {
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
            // Check for any definition and open it
            const message = this.getNavigation(alObject, document, position, definitionName);
            if (message) {
                internal_1.HelperFunctions.openUriFile(message.uri, message.lineNo);
                resolve(undefined);
                return undefined;
            }
            resolve(undefined);
            return undefined;
        }));
    }
    getNavigation(alObject, document, position, definitionName) {
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
    navigateToGlobalVariable(alObject, document, position, definitionName) {
        const alVariable = internal_1.HelperFunctions.navigateToGlobalVariable(alObject, document, position, definitionName);
        if (!alVariable) {
            return undefined;
        }
        return { uri: document.uri, lineNo: alVariable.lineNo };
    }
    navigateToFields(alObject, document, position, definitionName) {
        const field = internal_1.HelperFunctions.navigateToFields(alObject, document, position, definitionName);
        if (!field) {
            return undefined;
        }
        return { uri: document.uri, lineNo: field.lineNo };
    }
    navigateToNextFunction(alObject, document, position, definitionName) {
        const next = internal_1.HelperFunctions.navigateToNextLocalFunction(alObject, document, position, definitionName);
        if (!next) {
            return undefined;
        }
        return { uri: document.uri, lineNo: next.lineNo };
    }
    navigateToLocalFunction(alObject, document, position, definitionName) {
        const alFunction = internal_1.HelperFunctions.navigateToLocalFunction(alObject, document, position, definitionName);
        if (!alFunction) {
            return undefined;
        }
        return { uri: document.uri, lineNo: alFunction.lineNo };
    }
}
exports.ALDefinitionProvider = ALDefinitionProvider;
//# sourceMappingURL=ALDefinitionProvider.js.map