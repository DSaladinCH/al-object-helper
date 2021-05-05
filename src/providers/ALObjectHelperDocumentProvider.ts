import { CancellationToken, Event, TextDocumentContentProvider, Uri } from "vscode";
import JSZip = require("jszip");
import { HelperFunctions, reader } from "../internal";

export class ALObjectHelperDocumentProvider implements TextDocumentContentProvider {
    onDidChange?: Event<Uri> | undefined;

    async provideTextDocumentContent(uri: Uri, token: CancellationToken): Promise<string> {
        let message = JSON.parse(uri.fragment);
        let result: string = uri.fsPath;

        const alApp = reader.alApps.find(alApp => alApp.appName === message.AppName);
        if (!alApp){
            return result;
        }

        let alObject = alApp.alObjects.find(f => f.objectType === message.Type && f.objectID === message.ID);
        
        if (!alObject) {
            return result;
        }

        if (HelperFunctions.isLocalObject(alObject)) {
            return result;
        }

        let zipPath: string | undefined = HelperFunctions.getZipPath(alObject);
        if (!zipPath){
            return result;
        }
        let jsZip = await HelperFunctions.readZip(zipPath);
        if (!jsZip){
            return result;
        }
        
        let zipObject: JSZip.JSZipObject | null = jsZip.file(alObject.objectPath);
        if (zipObject === null){
            return result;
        }
        return await zipObject.async('string');
    }
}