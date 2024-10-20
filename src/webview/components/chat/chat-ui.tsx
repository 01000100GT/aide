import { useRef, type FC } from 'react'
import { GearIcon, MagnifyingGlassIcon, PlusIcon } from '@radix-ui/react-icons'
import { useChatContext, withChatContext } from '@webview/contexts/chat-context'
import { useGlobalSearch } from '@webview/contexts/global-search-context'
import { useChatState } from '@webview/hooks/chat/use-chat-state'
import { api } from '@webview/services/api-client'
import type { Conversation } from '@webview/types/chat'
import { logger } from '@webview/utils/logger'
import { useNavigate } from 'react-router'

import { ButtonWithTooltip } from '../button-with-tooltip'
import { GlowingCard } from '../glowing-card'
import { SidebarLayout } from '../sidebar-layout'
import { ChatInput, type ChatInputRef } from './editor/chat-input'
import { ChatMessages } from './messages/chat-messages'
import { ChatSidebar } from './sidebar/chat-sidebar'

const _ChatUI: FC = () => {
  const navigate = useNavigate()
  const {
    context,
    setContext,
    getContext,
    saveSession,
    createAndSwitchToNewSession
  } = useChatContext()
  const {
    newConversation,
    setNewConversation,
    resetNewConversation,
    historiesConversationsWithUIState,
    newConversationUIState,
    replaceConversationAndTrimHistory,
    prepareUIForSending,
    resetUIAfterSending,
    toggleConversationEditMode
  } = useChatState()
  const chatInputRef = useRef<ChatInputRef>(null)
  const { openSearch } = useGlobalSearch()

  const resetNewConversationInput = () => {
    resetNewConversation()
    chatInputRef.current?.resetEditor()
  }

  const handleSend = async (conversation: Conversation) => {
    try {
      replaceConversationAndTrimHistory(conversation)
      prepareUIForSending(conversation.id)
      await saveSession()
      await api.chat.streamChat(
        {
          chatContext: getContext()
        },
        (conversations: Conversation[]) => {
          logger.verbose('Received conversations:', conversations)
          setContext(draft => {
            draft.conversations = conversations
          })
        }
      )

      await saveSession()
      toggleConversationEditMode(conversation.id, false)

      if (conversation.id === newConversation.id) {
        resetNewConversationInput()
      }

      chatInputRef.current?.focusOnEditor()
    } finally {
      resetUIAfterSending(conversation.id)
    }
  }

  const handleEditModeChange = (
    isEditMode: boolean,
    conversation: Conversation
  ) => {
    toggleConversationEditMode(conversation.id, isEditMode)
  }

  return (
    <SidebarLayout
      title="Chat"
      sidebar={<ChatSidebar />}
      headerLeft={
        <>
          <ButtonWithTooltip
            variant="ghost"
            size="iconXs"
            tooltip="Search"
            side="bottom"
            className="shrink-0"
            onClick={openSearch}
          >
            <MagnifyingGlassIcon className="size-3" />
          </ButtonWithTooltip>
          <ButtonWithTooltip
            variant="ghost"
            size="iconXs"
            tooltip="New Chat"
            side="bottom"
            className="shrink-0"
            onClick={createAndSwitchToNewSession}
          >
            <PlusIcon className="size-3" />
          </ButtonWithTooltip>
          <ButtonWithTooltip
            variant="ghost"
            size="iconXs"
            tooltip="Settings"
            side="bottom"
            className="shrink-0"
            onClick={() => {
              navigate('/settings')
            }}
          >
            <GearIcon className="size-3" />
          </ButtonWithTooltip>
        </>
      }
      className="chat-ui"
    >
      <ChatMessages
        conversationsWithUIState={historiesConversationsWithUIState}
        context={context}
        setContext={setContext}
        onSend={handleSend}
        onEditModeChange={handleEditModeChange}
      />

      <GlowingCard isAnimated={newConversationUIState.isLoading}>
        <ChatInput
          ref={chatInputRef}
          autoFocus
          context={context}
          setContext={setContext}
          conversation={newConversation}
          setConversation={setNewConversation}
          sendButtonDisabled={
            newConversationUIState.isLoading ??
            newConversationUIState.sendButtonDisabled ??
            false
          }
          onSend={handleSend}
        />
      </GlowingCard>
    </SidebarLayout>
  )
}

export const ChatUI = withChatContext(_ChatUI)
