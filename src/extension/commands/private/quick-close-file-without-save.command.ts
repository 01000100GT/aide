import { t } from '@extension/i18n'
import * as vscode from 'vscode'

import { BaseCommand } from '../base.command'

export class QuickCloseFileWithoutSaveCommand extends BaseCommand {
  get commandName(): string {
    return 'aide.quickCloseFileWithoutSave'
  }

  async run(uri?: vscode.Uri): Promise<void> {
    const targetUri = uri
    if (!targetUri) return

    const targetEditor = vscode.window.visibleTextEditors.find(
      editor => editor.document.uri.toString() === targetUri.toString()
    )

    let documentToClose: vscode.TextDocument | undefined

    if (targetEditor) {
      documentToClose = targetEditor.document
    } else {
      documentToClose = vscode.workspace.textDocuments.find(
        doc => doc.uri.toString() === targetUri.toString()
      )
    }

    if (!documentToClose) throw new Error(t('error.noActiveEditor'))

    await vscode.window.showTextDocument(documentToClose)

    const command = documentToClose.isDirty
      ? 'workbench.action.revertAndCloseActiveEditor'
      : 'workbench.action.closeActiveEditor'

    await vscode.commands.executeCommand(command)
  }
}
