import { type ChatContext, type Conversation } from '@shared/entities'
import { UnPromise } from '@shared/types/common'
import { produce } from 'immer'

import { baseGraphStateEventName } from '../base/base-state'
import { BaseStrategy } from '../base/base-strategy'
import { createChatWorkflow } from './chat-workflow'
import { type ChatGraphState } from './state'

export class ChatStrategy extends BaseStrategy {
  private _chatWorkflow: UnPromise<
    ReturnType<typeof createChatWorkflow>
  > | null = null

  private getChatWorkflow = async () => {
    if (!this._chatWorkflow) {
      this._chatWorkflow = await createChatWorkflow({
        registerManager: this.registerManager,
        commandManager: this.commandManager
      })
    }

    return this._chatWorkflow
  }

  async *getAnswers(
    chatContext: ChatContext,
    abortController?: AbortController
  ): AsyncGenerator<Conversation[], void, unknown> {
    const chatWorkflow = await this.getChatWorkflow()
    const graph = chatWorkflow.compile()

    const eventStream = await graph.streamEvents(
      {
        chatContext,
        abortController
      },
      { version: 'v2' }
    )

    const state: Partial<ChatGraphState> = {}

    for await (const { event, name, data } of eventStream) {
      if (event === 'on_custom_event' && name === baseGraphStateEventName) {
        const returnsState = data as Partial<ChatGraphState>
        Object.assign(state, returnsState)
        const currentChatContext = state.chatContext || chatContext

        if (state.newConversations?.length) {
          const newChatContext = produce(currentChatContext, draft => {
            draft.conversations.push(...(state.newConversations ?? []))
          })

          yield newChatContext.conversations
        }
      }
    }
  }
}
