import {
  useEffect,
  useId,
  useImperativeHandle,
  useState,
  type FC,
  type Ref
} from 'react'
import { $generateHtmlFromNodes } from '@lexical/html'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import {
  LexicalComposer,
  type InitialConfigType
} from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { useQueryClient } from '@tanstack/react-query'
import { TypedText } from '@webview/components/ui/typed-text'
import { MentionNode } from '@webview/lexical/nodes/mention-node'
import {
  MentionPlugin,
  type MentionPluginProps
} from '@webview/lexical/plugins/mention-plugin'
import { cn } from '@webview/utils/common'
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  FOCUS_COMMAND,
  KEY_ENTER_COMMAND,
  type EditorState,
  type LexicalEditor
} from 'lexical'

const onError = (error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Editor error:', error)
}

export interface ChatEditorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    MentionPluginProps {
  ref?: Ref<ChatEditorRef>
  className?: string
  contentEditableClassName?: string
  initialConfig?: Partial<InitialConfigType>
  placeholder?: string | string[]
  autoFocus?: boolean
  onComplete?: (
    editorState: EditorState,
    editor: LexicalEditor,
    tags: Set<string>
  ) => void
  onChange?: (
    editorState: EditorState,
    editor: LexicalEditor,
    tags: Set<string>
  ) => void
}

export interface ChatEditorRef {
  editor: LexicalEditor
  insertSpaceAndAt: () => void
  focusOnEditor: (autoMoveCursorToEnd?: boolean) => void
  resetEditor: () => void
  copyWithFormatting: () => void
}

export const ChatEditor: FC<ChatEditorProps> = ({
  ref,
  className,
  initialConfig,
  placeholder,
  autoFocus = false,
  onComplete,
  onChange,
  ...otherProps
}) => {
  const id = useId()
  const finalInitialConfig: InitialConfigType = {
    namespace: `TextComponentEditor-${id}`,
    // theme: normalTheme,
    onError,
    editable: true,
    nodes: [MentionNode],
    ...initialConfig
  }

  return (
    <LexicalComposer initialConfig={finalInitialConfig}>
      <ChatEditorInner
        ref={ref}
        className={className}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onComplete={onComplete}
        onChange={onChange}
        {...otherProps}
      />
    </LexicalComposer>
  )
}

const ChatEditorInner: FC<ChatEditorProps> = ({
  ref,
  className,
  contentEditableClassName,
  placeholder,
  autoFocus,
  onComplete,
  onChange,

  // div props
  ...otherProps
}) => {
  const [editor] = useLexicalComposerContext()
  const [isHovered, setIsHovered] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(true)

  const handleMouseOver = () => {
    setIsHovered(true)
  }

  const handleMouseOut = () => {
    setIsHovered(false)
    setShowPlaceholder(true)
  }

  const handleClick = () => {
    setShowPlaceholder(false)
  }

  const insertSpaceAndAt = () => {
    editor.focus()
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        selection.insertText(' @')
      }
    })
  }

  const focusOnEditor = (autoMoveCursorToEnd = false) => {
    const rootEl = editor.getRootElement()

    if (!rootEl?.children?.length) {
      rootEl?.focus({
        preventScroll: true
      }) // if the editor is empty, focus on it
    } else {
      editor.focus(
        () => {
          rootEl.focus({
            preventScroll: true
          })
        },
        {
          defaultSelection: 'rootEnd'
        }
      )

      if (autoMoveCursorToEnd) {
        // move the cursor to the end of the editor
        editor.update(() => {
          const root = $getRoot()
          const lastChild = root.getLastChild()
          lastChild?.selectEnd()
        })
      }
    }
  }

  const resetEditor = () => {
    editor.update(() => {
      const root = $getRoot()
      root.clear()
    })
  }

  const copyWithFormatting = () => {
    editor.update(() => {
      const htmlString = $generateHtmlFromNodes(editor)
      // Create a temporary element to hold the HTML content
      const tempElement = document.createElement('div')
      tempElement.innerHTML = htmlString

      // Create a range and selection
      const range = document.createRange()
      range.selectNodeContents(tempElement)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)

      // Execute copy command
      document.execCommand('copy')

      // Clean up
      selection?.removeAllRanges()
      tempElement.remove()
    })
  }

  useEffect(() => {
    if (!autoFocus) return
    focusOnEditor()
  }, [autoFocus, focusOnEditor])

  useImperativeHandle(
    // eslint-disable-next-line react-compiler/react-compiler
    ref,
    () => ({
      editor,
      insertSpaceAndAt,
      focusOnEditor,
      resetEditor,
      copyWithFormatting
    }),
    [editor]
  )

  useEffect(() => {
    const removeKeyEnterListener = editor.registerCommand(
      KEY_ENTER_COMMAND,
      event => {
        if (event && (event.ctrlKey || event.metaKey)) {
          event.preventDefault()
          const currentState = editor.getEditorState()
          const tags = new Set<string>()
          onComplete?.(currentState, editor, tags)
          return true // prevent other Enter behaviors
        }

        return false // allow other Enter behaviors
      },
      COMMAND_PRIORITY_CRITICAL
    )

    return () => {
      removeKeyEnterListener()
    }
  }, [editor, onComplete])

  const queryClient = useQueryClient()
  useEffect(
    () =>
      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          queryClient.invalidateQueries({
            queryKey: ['realtime']
          })
          return false // Let other focus handlers run
        },
        1 // Low priority to ensure it runs after other focus handlers
      ),
    [editor, queryClient]
  )

  return (
    <div
      className={cn('editor-container relative', className)}
      tabIndex={1}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onClick={handleClick}
      {...otherProps}
    >
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className={cn(
              'editor-input min-h-24 min-w-full py-2 outline-none',
              contentEditableClassName
            )}
          />
        }
        placeholder={
          showPlaceholder ? (
            <div className="editor-placeholder absolute pointer-events-none top-2 left-0 text-foreground/50">
              <TypedText
                strings={
                  Array.isArray(placeholder) ? placeholder : [placeholder || '']
                }
                typeSpeed={40}
                backSpeed={30}
                backDelay={2000}
                loop={Array.isArray(placeholder)}
                showCursor={Array.isArray(placeholder)}
                cursorChar=""
                isPaused={isHovered}
              />
            </div>
          ) : null
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <OnChangePlugin onChange={onChange!} />
      <MentionPlugin />
      <HistoryPlugin />
      {autoFocus && <AutoFocusPlugin defaultSelection="rootEnd" />}
      <TabIndentationPlugin />
      {/* <TreeViewDebugPlugin /> */}
    </div>
  )
}
