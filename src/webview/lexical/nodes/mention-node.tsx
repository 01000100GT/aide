/* eslint-disable unused-imports/no-unused-vars */
import React from 'react'
import {
  $applyNodeReplacement,
  $createTextNode,
  $isTextNode,
  DecoratorNode,
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  type DOMConversionOutput
} from 'lexical'

export type SerializedMentionNode = Spread<
  {
    mentionType: string
    mentionData: any
    text: string
  },
  SerializedLexicalNode
>

function convertMentionElement(
  domNode: HTMLElement
): DOMConversionOutput | null {
  const mentionType = domNode.getAttribute('data-lexical-mention-type')
  const mentionData = domNode.getAttribute('data-lexical-mention-data')
  const text = domNode.textContent

  if (mentionType && text) {
    const node = $createMentionNode(
      mentionType,
      JSON.parse(mentionData || '{}'),
      text
    )
    return { node }
  }
  return null
}

export class MentionNode extends DecoratorNode<React.ReactNode> {
  __mentionType: string

  __mentionData: any

  __text: string

  static getType(): string {
    return 'mention'
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(
      node.__mentionType,
      node.__mentionData,
      node.__text,
      node.__key
    )
  }

  constructor(
    mentionType: string,
    mentionData: any,
    text: string,
    key?: NodeKey
  ) {
    super(key)
    this.__mentionType = mentionType
    this.__mentionData = mentionData
    this.__text = text
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('span')
    dom.setAttribute('data-lexical-mention', 'true')
    dom.setAttribute('data-lexical-mention-type', this.__mentionType)
    dom.setAttribute(
      'data-lexical-mention-data',
      JSON.stringify(this.__mentionData)
    )
    return dom
  }

  updateDOM(): boolean {
    return false
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-mention')) {
          return null
        }
        return {
          conversion: convertMentionElement,
          priority: 1
        }
      }
    }
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span')
    element.setAttribute('data-lexical-mention', 'true')
    element.setAttribute('data-lexical-mention-type', this.__mentionType)
    element.setAttribute(
      'data-lexical-mention-data',
      JSON.stringify(this.__mentionData)
    )
    element.textContent = this.__text
    return { element }
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    const { mentionType, mentionData, text } = serializedNode
    const node = $createMentionNode(mentionType, mentionData, text)
    return node
  }

  exportJSON(): SerializedMentionNode {
    return {
      type: 'mention',
      mentionType: this.__mentionType,
      mentionData: this.__mentionData,
      text: this.__text,
      version: 1
    }
  }

  getTextContent(): string {
    return this.__text
  }

  decorate(editor: LexicalEditor, config: EditorConfig): React.ReactNode {
    return (
      <span
        className="mention"
        style={{
          backgroundColor: 'hsl(var(--primary))',
          fontSize: '12px',
          borderRadius: '4px',
          margin: '1px 1px',
          color: 'hsl(var(--primary-foreground))',
          display: 'inline-block',
          padding: '0 2px'
        }}
      >
        {this.__text}
      </span>
    )
  }

  isInline(): boolean {
    return true
  }

  isIsolated(): boolean {
    return true
  }

  extractWithChild(): boolean {
    return true
  }

  canInsertTextBefore(): boolean {
    return false
  }

  canInsertTextAfter(): boolean {
    return false
  }

  splitText(): never {
    throw new Error('MentionNode: splitText is not supported')
  }

  canExtractContents(): boolean {
    return false
  }

  canReplaceWith(replacement: LexicalNode): boolean {
    return $isTextNode(replacement)
  }

  canMergeWith(node: LexicalNode): boolean {
    return false
  }

  collapseAtStart(): boolean {
    const textNode = $createTextNode(this.__text)
    this.replace(textNode)
    return true
  }
}

export function $createMentionNode(
  mentionType: string,
  mentionData: any,
  text: string
): MentionNode {
  return $applyNodeReplacement(new MentionNode(mentionType, mentionData, text))
}

export function $isMentionNode(
  node: LexicalNode | null | undefined
): node is MentionNode {
  return node instanceof MentionNode
}
