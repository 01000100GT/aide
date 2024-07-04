import { getConfigKey } from '@/config'
import { createTempFileAndWriter } from '@/create-tmp-file'
import { t } from '@/i18n'
import { askOpenAIStream } from '@/llm'
import * as vscode from 'vscode'

const askAiForCode = async ({
  sourceLanguage,
  code
}: {
  sourceLanguage: string
  code: string
}) => {
  const locale = vscode.env.language
  const codeViewerHelperPrompt = await getConfigKey('codeViewerHelperPrompt')
  const prompt = codeViewerHelperPrompt
    .replace('#{sourceLanguage}', sourceLanguage)
    .replace('#{locale}', locale)
    .replace('#{content}', code)

  return askOpenAIStream(prompt)
}

export const handleCodeViewerHelper = async () => {
  const activeEditor = vscode.window.activeTextEditor
  if (!activeEditor) {
    vscode.window.showInformationMessage(t('info.noActiveEditor'))
    return
  }

  const content = activeEditor.document.getText()

  const currentLanguage = activeEditor.document.languageId

  const { writeTextPart } = await createTempFileAndWriter({
    languageId: currentLanguage,
    buildFileName: (originalFileName, languageExt) =>
      `${originalFileName}.temp.${languageExt}`
  })

  const result = await askAiForCode({
    sourceLanguage: currentLanguage,
    code: content
  })

  for await (const textPart of result.textStream) {
    await writeTextPart(textPart)
  }
}
