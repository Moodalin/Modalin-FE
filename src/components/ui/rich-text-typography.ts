import { Extension } from '@tiptap/react'

export type RichTextTypographyAttribute = 'fontSize' | 'lineHeight'

type TypographyOption = {
  value: string
  label: string
}

export const fontSizeOptions: readonly TypographyOption[] = [8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72].map((size) => ({ value: `${size}px`, label: String(size) }))

export const lineHeightOptions: readonly TypographyOption[] = [
  { value: '', label: '1,5' },
  { value: '1.25', label: '1,25' },
  { value: '1.5', label: '1,5' },
  { value: '1.75', label: '1,75' },
  { value: '2', label: '2,0' },
]

const allowedLineHeights: Record<string, true> = { '1.25': true, '1.5': true, '1.75': true, '2': true }

export function isRichTextTypographyValue(attribute: RichTextTypographyAttribute, value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (attribute === 'lineHeight') return Object.hasOwn(allowedLineHeights, value)
  const match = /^(\d{1,2})px$/.exec(value)
  return Boolean(match && Number(match[1]) >= 8 && Number(match[1]) <= 72)
}

export function getRichTextTypographyStyle(attrs?: Record<string, unknown>) {
  const fontSize = isRichTextTypographyValue('fontSize', attrs?.fontSize) ? attrs.fontSize : undefined
  const lineHeight = isRichTextTypographyValue('lineHeight', attrs?.lineHeight) ? attrs.lineHeight : undefined
  return fontSize || lineHeight ? { fontSize, lineHeight } : undefined
}
export function getRichTextTypographyHTMLAttributes(attrs: Record<string, unknown>) {
  const style = getRichTextTypographyStyle(attrs)
  if (!style) return {}
  const declarations = [
    style.fontSize ? `font-size: ${style.fontSize}` : null,
    style.lineHeight ? `line-height: ${style.lineHeight}` : null,
  ].filter(Boolean)
  return { style: declarations.join('; ') }
}


export const RichTextTypography = Extension.create({
  name: 'richTextTypography',
  addGlobalAttributes() {
    return [{
      types: ['paragraph', 'heading'],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (element) => isRichTextTypographyValue('fontSize', element.style.fontSize) ? element.style.fontSize : null,
          renderHTML: getRichTextTypographyHTMLAttributes,
        },
        lineHeight: {
          default: null,
          parseHTML: (element) => isRichTextTypographyValue('lineHeight', element.style.lineHeight) ? element.style.lineHeight : null,
          renderHTML: () => ({}),
        },
      },
    }]
  },
})
