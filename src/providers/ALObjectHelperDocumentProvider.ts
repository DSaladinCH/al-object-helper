import { CancellationToken, Event, TextDocumentContentProvider, Uri } from "vscode";
import JSZip = require("jszip");
import { ALEnum, ALObject, ALTable, ALVariable, HelperFunctions, ObjectType, reader } from "../internal";

export class ALObjectHelperDocumentProvider implements TextDocumentContentProvider {
    onDidChange?: Event<Uri> | undefined;

    async provideTextDocumentContent(uri: Uri, token: CancellationToken): Promise<string | undefined> {
        let message = JSON.parse(uri.fragment);
        let result: string = uri.fsPath;

        // const alApp = reader.alApps.find(alApp => alApp.appName === message.AppName);
        // if (!alApp){
        //     return result;
        // }

        // let alObject = alApp.alObjects.find(f => f.objectType === message.Type && f.objectID === message.ID);

        // if (!alObject) {
        //     return result;
        // }

        let alObject = HelperFunctions.getALObjectByUriFragment(uri.fragment);
        if (!alObject) {
            return undefined;
        }

        if (HelperFunctions.isLocalObject(alObject)) {
            return result;
        }

        if (!alObject.alApp.showMyCode) {
            return this.createSymbolFile(alObject);
        }

        let zipPath: string | undefined = HelperFunctions.getZipPath(alObject);
        if (!zipPath) {
            return undefined;
        }
        let jsZip = await HelperFunctions.readZip(zipPath);
        if (!jsZip) {
            return undefined;
        }

        let zipObject: JSZip.JSZipObject | null = jsZip.file(alObject.objectPath);
        if (zipObject === null) {
            return undefined;
        }

        return await zipObject.async('string');
    }

    private createSymbolFile(alObject: ALObject): string {
        let fileText = "";
        fileText += "// ------------------- AL Object Helper ------------------- //\n";
        fileText += "// This feature is in preview and still has missing parts!  //\n";
        fileText += "// Report any weird behaviour on GitHub                     //\n";
        fileText += "// -------------------------------------------------------- //\n";
        fileText += "\n";
        fileText += ObjectType[alObject.objectType].toLowerCase();

        if (alObject.objectID != "") {
            fileText += " " + alObject.objectID;
        }

        fileText += " \"" + alObject.objectName + "\"\n";
        fileText += this.addArea(false, 0);

        for (const property of alObject.properties.entries()) {
            fileText += "\t" + this.getProperty(property);
        }

        fileText += this.typeSpecificContent(alObject);

        if (alObject.variables.length > 0) {
            fileText += "\n";
            fileText += "\tvar\n";

            alObject.variables.forEach(variable => {
                fileText += "\t\t" + this.getVariable(variable) + "\n";
            });
        }

        if (alObject.functions.length > 0) {
            alObject.functions.forEach(procedure => {
                fileText += "\n";

                // TODO: Add function argument
                // function definition
                fileText += `\t${procedure.isLocal ? "local " : ""}procedure ${procedure.functionName}(`;

                if (procedure.parameters.length > 0) {
                    procedure.parameters.forEach(parameter => {
                        fileText += this.getVariable(parameter) + " ";
                    });

                    fileText = fileText.slice(0, -2);
                }

                fileText += ")";

                if (procedure.returnValue) {
                    fileText += this.getVariable(procedure.returnValue);
                }

                fileText += "\n";

                // variables
                if (procedure.variables.length > 0) {
                    fileText += "\tvar\n";

                    alObject.variables.forEach(variable => {
                        fileText += "\t\t" + this.getVariable(variable) + "\n";
                    });
                }

                fileText += "\tbegin\n";

                fileText += "\tend\n";
            });
        }

        fileText += this.addArea(true, 0);
        return fileText;
    }

    private addArea(end: boolean, tabulator: number): string {
        let area = "";
        for (let i = 0; i < tabulator; i++) {
            area += "\t";
        }

        if (end) {
            area += "}";
        }
        else {
            area += "{";
        }

        return area + "\n";
    }

    private getProperty(property: [key: string, value: string]): string {
        switch (property[0].toLowerCase()) {
            case 'caption':
            case 'captionml':
            case 'abouttext':
            case 'abouttextml':
            case 'abouttitle':
            case 'abouttitleml':
            case 'additionalsearchterms':
            case 'additionalsearchtermsml':
            case 'instructionaltext':
            case 'instructionaltextml':
            case 'promotedactioncategories':
            case 'promotedactioncategoriesml':
            case 'tooltip':
            case 'tooltipml':
            case 'optioncaption':
            case 'optioncaptionml':
                return `${property[0]} = '${property[1]}';\n`;
            case 'promoted':
            case 'promotedonly':
            case 'extensible':
            case 'editable':
            case 'singleinstance':
                return `${property[0]} = ${Boolean(property[1])};\n`;
        }

        return `${property[0]} = ${property[1]};\n`;
    }

    private getVariable(variable: ALVariable): string {
        let text = "";
        text += variable.isVar ? "var " : "";

        // variable name may be empty -> procedure return value
        text += variable.variableName;
        text += ": ";

        text += variable.dataType;
        text += variable.subType !== "" ? " " + variable.subType : "";

        text += variable.isTemporary ? " temporary" : "";
        text += ";";

        return text;
    }

    private typeSpecificContent(alObject: ALObject): string {
        let fileText = "";

        if (alObject.objectType === ObjectType.Table) {
            fileText += "\n";
            fileText += "\tfields\n";
            fileText += this.addArea(false, 1);

            (alObject as ALTable).fields.forEach(field => {
                fileText += `\t\tfield(${field.fieldID}; "${field.fieldName}"; ${field.dataType})\n`;
                fileText += this.addArea(false, 2);

                for (const property of field.properties.entries()) {
                    fileText += "\t\t\t" + this.getProperty(property);
                }

                fileText += this.addArea(true, 2);
            });

            fileText += this.addArea(true, 1);
            return fileText;
        }

        if (alObject.objectType === ObjectType.Enum) {
            fileText += "\n";

            (alObject as ALEnum).fields.forEach(field => {
                fileText += `\tvalue(${field.fieldID}; "${field.fieldName}")\n`;
                fileText += this.addArea(false, 1);

                for (const property of field.properties.entries()) {
                    fileText += "\t\t" + this.getProperty(property);
                }

                fileText += this.addArea(true, 1);
            });

            return fileText;
        }

        fileText += "\n";
        fileText += "\t// The rest is not implemented yet!\n";
        return fileText;
    }
}