import { Extension } from '@tiptap/react'

export type RichTextTypographyAttribute = 'fontSize' | 'lineHeight'

type TypographyOption = {
  value: string
  label: string
}

export const fontSizeOptions: readonly TypographyOption[] = [
  { value: '', label: 'Ukuran teks' },
  { value: '14px', label: '14 px' },
  { value: '16px', label: '16 px' },
  { value: '18px', label: '18 px' },
  { value: '20px', label: '20 px' },
  { value: '24px', label: '24 px' },
]

export const lineHeightOptions: readonly TypographyOption[] = [
  { value: '', label: 'Jarak baris' },
  { value: '1.25', label: '1,25' },
  { value: '1.5', label: '1,5' },
  { value: '1.75', label: '1,75' },
  { value: '2', label: '2' },
]

const allowedFontSizes: Record<string, true> = { '14px': true, '16px': true, '18px': true, '20px': true, '24px': true }
const allowedLineHeights: Record<string, true> = { '1.25': true, '1.5': true, '1.75': true, '2': true }

export function isRichTextTypographyValue(attribute: RichTextTypographyAttribute, value: unknown): value is string {
  return typeof value === 'string' && Object.hasOwn(attribute === 'fontSize' ? allowedFontSizes : allowedLineHeights, value)
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
