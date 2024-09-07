import type {
  Attachments,
  Conversation
} from '@extension/webview-api/chat-context-processor/types/chat-context'

export * from '@extension/webview-api/chat-context-processor/types/chat-context'

export interface ModelOption {
  value: string
  label: string
}

export interface MentionOption {
  label: string
  category: MentionCategory
  mentionStrategies: IMentionStrategy[]
}

export enum MentionCategory {
  Files = 'Files',
  Folders = 'Folders',
  Code = 'Code',
  Web = 'Web',
  Docs = 'Docs',
  Git = 'Git',
  Codebase = 'Codebase'
}

export interface IMentionStrategy {
  readonly category: MentionCategory
  readonly name: string

  buildLexicalNodeAfterAddMention?: (
    data: any,
    currentAttachments: Attachments,
    currentConversation: Conversation
  ) => Promise<string>

  buildNewAttachmentsAfterAddMention: (
    data: any,
    currentAttachments: Attachments
  ) => Promise<Partial<Attachments>>
}
