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
exports.ALObjectHelperDocumentProvider = void 0;
const internal_1 = require("../internal");
class ALObjectHelperDocumentProvider {
    provideTextDocumentContent(uri, token) {
        return __awaiter(this, void 0, void 0, function* () {
            let message = JSON.parse(uri.fragment);
            let result = uri.fsPath;
            const alApp = internal_1.reader.alApps.find(alApp => alApp.appName === message.AppName);
            if (!alApp) {
                return result;
            }
            let alObject = alApp.alObjects.find(f => f.objectType === message.Type && f.objectID === message.ID);
            if (!alObject) {
                return result;
            }
            if (internal_1.HelperFunctions.isLocalObject(alObject)) {
                return result;
            }
            let zipPath = internal_1.HelperFunctions.getZipPath(alObject);
            if (!zipPath) {
                return result;
            }
            let jsZip = yield internal_1.HelperFunctions.readZip(zipPath);
            if (!jsZip) {
                return result;
            }
            let zipObject = jsZip.file(alObject.objectPath);
            if (zipObject === null) {
                return result;
            }
            return yield zipObject.async('string');
        });
    }
}
exports.ALObjectHelperDocumentProvider = ALObjectHelperDocumentProvider;
//# sourceMappingURL=ALObjectHelperDocumentProvider.js.map