/*********************************************************************
 * Copyright (c) 2018 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export const YEARS_IDENTIFIER = '${Years}';
export const AUTHORS_IDENTIFIER = '${Authors}';

export const MIT_LICENSE_HEADER_CONTENT = `/*\n* Copyright (c) ${YEARS_IDENTIFIER}${AUTHORS_IDENTIFIER}. All rights reserved.\n* @license MIT\n*/\n`;
export const MIT_LICENSE_HEDER_REGEXP = new RegExp(/.*(Copyright \(c\) )[0-9]{4,}.*(. All rights reserved.\n).*(@license MIT\n).*/);

export const PACKAGE_JSON = 'package.json';

export const SUPPORTED_EXTENSIONS = ['.js', '.ts'];
export const SUPPORTED_LICENCE_HEADERS = ['MIT'];

export class LicenseHeader {

  constructor(private readonly authors: string, private readonly licenseContent: string, private readonly licenceRegexp: RegExp) {}

  getHeader(): string {
    const currentYear = new Date().getFullYear();
    const spaceAfterYear = this.authors ? ' ' : '';
    const header = this.licenseContent.replace(YEARS_IDENTIFIER, currentYear + spaceAfterYear).replace(AUTHORS_IDENTIFIER, this.authors || '');
    return header;
  }

  getRegExpr(): RegExp {
    return this.licenceRegexp;
  }
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.workspace.onWillSaveTextDocument(fileSaveEvent => {
      const fileContentPromise = new Promise<void | vscode.TextEdit[]>((resolve, reject) => {
        const fileExt = path.extname(fileSaveEvent.document.uri.fsPath);
        if (!SUPPORTED_EXTENSIONS.find((supportedExt => supportedExt === fileExt))) {
          resolve(); // todo resolve
        }
        const fileUri = fileSaveEvent.document.uri;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
        
        if (workspaceFolder) {
          const packageJsonPath = path.resolve(workspaceFolder.uri.fsPath, PACKAGE_JSON);
          if (fs.existsSync(packageJsonPath)) {
              const packageJson = require(packageJsonPath);

              if (packageJson.license && isSupported(packageJson.license, SUPPORTED_LICENCE_HEADERS)) {
                const document = getDocument(fileSaveEvent.document.uri);
                if (document) {
                    const fileText = document.getText();

                    const textEdits: vscode.TextEdit[] = [];
                    const mitLicenceHeader = new LicenseHeader(packageJson.authors, MIT_LICENSE_HEADER_CONTENT, MIT_LICENSE_HEDER_REGEXP);
                    const licenceRegexp = mitLicenceHeader.getRegExpr();

                    console.log('test! ' + licenceRegexp.test(fileText));
                    if (!licenceRegexp.test(fileText)) {
                      console.log('OMG, it should not be!!!!');
                      console.log(fileText);
                    }

                    if (!licenceRegexp.test(fileText)) {
                      const licenceTextEdit = vscode.TextEdit.insert(document.lineAt(0).range.start, mitLicenceHeader.getHeader());
                      textEdits.push(licenceTextEdit);
                    }
                    
                    resolve(textEdits);
                    return;
                  }
              }
          }
          resolve();
        }
      });
  
      
      // const promiseDelay = sleep(150).then(() => {
      //   const document = getDocument(fileSaveEvent.document.uri);

      //   if (document) {
      //     console.log('ext name ', path.extname(document.uri.path));
      //     const fileText = document.getText();

      //     const textEdits: vscode.TextEdit[] = [];
      //     if (!fileText.startsWith(MIT_LICENSE_HEADER)) {
      //       const licenceTextEdit = vscode.TextEdit.insert(document.lineAt(0).range.start, MIT_LICENSE_HEADER);
      //       textEdits.push(licenceTextEdit);
      //     }
      //     console.log('why not?'); 
      //     return textEdits;
      //   }
      // });

      fileSaveEvent.waitUntil(fileContentPromise);
      // }));
      // fileSaveEvent.waitUntil(new Promise<void>((resolve, reject) => {

      // }));

      // fileSaveEvent.waitUntil(new Promise<vscode.TextEdit[]>((resolve, reject) => {
      //     const document = getDocument(fileSaveEvent.document.uri);

      //     if (document) {
      //       const fileText = document.getText();

      //       const textEdits: vscode.TextEdit[] = [];
      //       if (!fileText.startsWith(MIT_LICENSE_HEADER)) {
      //         const licenceTextEdit = vscode.TextEdit.insert(document.lineAt(0).range.start, MIT_LICENSE_HEADER);
      //         textEdits.push(licenceTextEdit);
      //       }
            
      //       resolve(textEdits);
      //     }
      // }));

      
  }));
}

function isSupported(item: string, supportedElems: string[]): boolean {
  return supportedElems.findIndex((supportedElem => supportedElem === item)) >= 0;
}

function sleep(milliseconds: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function getDocument(fileUri: vscode.Uri): vscode.TextDocument | undefined {
  return vscode.workspace.textDocuments.find((document) => {
    if (document.uri === fileUri) {
      return true;
    }
    return false;
  });
}

export function stop() {
}
