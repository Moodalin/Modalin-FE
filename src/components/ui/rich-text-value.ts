
type RichTextMark = {
  type: string
  attrs?: Record<string, unknown>
}

export type RichTextNode = {
  type?: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: RichTextMark[]
  content?: RichTextNode[]
}

export type RichTextDocument = RichTextNode & {
  type: 'doc'
}

function isRichTextDocument(value: unknown): value is RichTextDocument {
  return Boolean(value && typeof value === 'object' && (value as RichTextNode).type === 'doc' && (!('content' in value) || Array.isArray((value as RichTextNode).content)))
}

function textDocument(value: string): RichTextDocument {
  const paragraphs = value.split(/\r?\n/)
  return {
    type: 'doc',
    content: paragraphs.map((paragraph) => ({
      type: 'paragraph',
      ...(paragraph ? { content: [{ type: 'text', text: paragraph }] } : {}),
    })),
  }
}


export function parseRichText(value: string): RichTextDocument {
  const trimmed = value.trim()
  if (!trimmed) return { type: 'doc', content: [{ type: 'paragraph' }] }
  if (trimmed.startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (isRichTextDocument(parsed)) return parsed
    } catch {
      // Legacy plain text can begin with a brace.
    }
  }
  return textDocument(value)
}

function nodeText(node: RichTextNode): string {
  if (node.type === 'text') return node.text ?? ''
  if (node.type === 'hardBreak') return '\n'
  const text = (node.content ?? []).map(nodeText).join('')
  return ['paragraph', 'heading', 'blockquote', 'listItem'].includes(node.type ?? '') ? `${text}\n` : text
}

export function richTextToPlainText(value: string): string {
  return nodeText(parseRichText(value)).replace(/\n{3,}/g, '\n\n').trim()
}

export function richTextLength(value: string): number {
  return richTextToPlainText(value).length
}
