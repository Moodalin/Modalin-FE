import { Fragment, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Bold, Code, Heading2, Heading3, Italic, Link2, List, ListOrdered, Maximize2, Minimize2, Minus, Pilcrow, Quote, Redo2, RemoveFormatting, Strikethrough, Underline, Undo2 } from 'lucide-react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from '@/components/ui/utils'
import { parseRichText, richTextToPlainText, type RichTextNode } from '@/components/ui/rich-text-value'
import { RichTextTypography, fontSizeOptions, getRichTextTypographyStyle, isRichTextTypographyValue, lineHeightOptions, type RichTextTypographyAttribute } from '@/components/ui/rich-text-typography'


function safeHref(value: unknown) {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? value : null
  } catch {
    return null
  }
}

function renderText(node: RichTextNode, key: string): ReactNode {
  let content: ReactNode = node.text ?? ''
  for (const [index, mark] of (node.marks ?? []).entries()) {
    const markKey = `${key}-mark-${index}`
    if (mark.type === 'bold') content = <strong key={markKey}>{content}</strong>
    else if (mark.type === 'italic') content = <em key={markKey}>{content}</em>
    else if (mark.type === 'strike') content = <s key={markKey}>{content}</s>
    else if (mark.type === 'underline') content = <u key={markKey}>{content}</u>
    else if (mark.type === 'code') content = <code key={markKey}>{content}</code>
    else if (mark.type === 'link') {
      const href = safeHref(mark.attrs?.href)
      if (href) content = <a key={markKey} href={href} target="_blank" rel="noreferrer">{content}</a>
    }
  }
  return content
}

function renderNode(node: RichTextNode, key: string): ReactNode {
  if (node.type === 'text') return renderText(node, key)
  if (node.type === 'hardBreak') return <br key={key} />
  if (node.type === 'horizontalRule') return <hr key={key} />
  const children = (node.content ?? []).map((child, index) => renderNode(child, `${key}-${index}`))
  if (node.type === 'paragraph') return <p key={key} style={getRichTextTypographyStyle(node.attrs)}>{children}</p>
  if (node.type === 'heading') {
    const level = node.attrs?.level === 3 ? 3 : 2
    return level === 3 ? <h3 key={key} style={getRichTextTypographyStyle(node.attrs)}>{children}</h3> : <h2 key={key} style={getRichTextTypographyStyle(node.attrs)}>{children}</h2>
  }
  if (node.type === 'bulletList') return <ul key={key}>{children}</ul>
  if (node.type === 'orderedList') return <ol key={key}>{children}</ol>
  if (node.type === 'listItem') return <li key={key}>{children}</li>
  if (node.type === 'blockquote') return <blockquote key={key}>{children}</blockquote>
  if (node.type === 'codeBlock') return <pre key={key}><code>{children}</code></pre>
  return <span key={key}>{children}</span>
}

const richTextClasses = 'space-y-3 text-base leading-8 text-muted [&_a]:font-bold [&_a]:text-primary-dark [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-primary/35 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-cream [&_code]:px-1 [&_h2]:pt-2 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-ink [&_h3]:pt-1 [&_h3]:text-lg [&_h3]:font-extrabold [&_h3]:text-ink [&_hr]:border-line [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-ink [&_pre]:p-4 [&_pre]:text-white [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6'

export function RichTextView({ value, className }: { value: string; className?: string }) {
  const document = parseRichText(value)
  return <div className={cn(richTextClasses, className)}>{(document.content ?? []).map((node, index) => renderNode(node, `rich-${index}`))}</div>
}

type RichTextEditorProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  required?: boolean
  maxLength?: number
  className?: string
}

type ToolbarContext = {
  editor: Editor
  openLinkEditor: () => void
}

type ToolbarAction = {
  label: string
  icon: typeof Bold
  active?: (editor: Editor) => boolean
  enabled?: (editor: Editor) => boolean
  popover?: boolean
  run: (context: ToolbarContext) => void
}

const toolbarGroups: ToolbarAction[][] = [
  [
    { label: 'Paragraf', icon: Pilcrow, active: (editor) => editor.isActive('paragraph'), enabled: (editor) => editor.can().chain().setParagraph().run(), run: ({ editor }) => { editor.chain().focus().setParagraph().run() } },
    { label: 'Judul 2', icon: Heading2, active: (editor) => editor.isActive('heading', { level: 2 }), enabled: (editor) => editor.can().chain().toggleHeading({ level: 2 }).run(), run: ({ editor }) => { editor.chain().focus().toggleHeading({ level: 2 }).run() } },
    { label: 'Judul 3', icon: Heading3, active: (editor) => editor.isActive('heading', { level: 3 }), enabled: (editor) => editor.can().chain().toggleHeading({ level: 3 }).run(), run: ({ editor }) => { editor.chain().focus().toggleHeading({ level: 3 }).run() } },
  ],
  [
    { label: 'Tebal', icon: Bold, active: (editor) => editor.isActive('bold'), enabled: (editor) => editor.can().chain().toggleBold().run(), run: ({ editor }) => { editor.chain().focus().toggleBold().run() } },
    { label: 'Miring', icon: Italic, active: (editor) => editor.isActive('italic'), enabled: (editor) => editor.can().chain().toggleItalic().run(), run: ({ editor }) => { editor.chain().focus().toggleItalic().run() } },
    { label: 'Garis bawah', icon: Underline, active: (editor) => editor.isActive('underline'), enabled: (editor) => editor.can().chain().toggleUnderline().run(), run: ({ editor }) => { editor.chain().focus().toggleUnderline().run() } },
    { label: 'Coret', icon: Strikethrough, active: (editor) => editor.isActive('strike'), enabled: (editor) => editor.can().chain().toggleStrike().run(), run: ({ editor }) => { editor.chain().focus().toggleStrike().run() } },
    { label: 'Kode', icon: Code, active: (editor) => editor.isActive('code'), enabled: (editor) => editor.can().chain().toggleCode().run(), run: ({ editor }) => { editor.chain().focus().toggleCode().run() } },
  ],
  [
    { label: 'Daftar berpoin', icon: List, active: (editor) => editor.isActive('bulletList'), enabled: (editor) => editor.can().chain().toggleBulletList().run(), run: ({ editor }) => { editor.chain().focus().toggleBulletList().run() } },
    { label: 'Daftar bernomor', icon: ListOrdered, active: (editor) => editor.isActive('orderedList'), enabled: (editor) => editor.can().chain().toggleOrderedList().run(), run: ({ editor }) => { editor.chain().focus().toggleOrderedList().run() } },
    { label: 'Kutipan', icon: Quote, active: (editor) => editor.isActive('blockquote'), enabled: (editor) => editor.can().chain().toggleBlockquote().run(), run: ({ editor }) => { editor.chain().focus().toggleBlockquote().run() } },
  ],
  [
    { label: 'Tautan', icon: Link2, active: (editor) => editor.isActive('link'), enabled: (editor) => editor.isActive('link') || !editor.state.selection.empty, popover: true, run: ({ openLinkEditor }) => openLinkEditor() },
    { label: 'Garis pemisah', icon: Minus, enabled: (editor) => editor.can().chain().setHorizontalRule().run(), run: ({ editor }) => { editor.chain().focus().setHorizontalRule().run() } },
  ],
  [
    { label: 'Hapus format', icon: RemoveFormatting, enabled: (editor) => editor.can().chain().unsetAllMarks().run(), run: ({ editor }) => { editor.chain().focus().unsetAllMarks().clearNodes().run() } },
  ],
  [
    { label: 'Urungkan', icon: Undo2, enabled: (editor) => editor.can().undo(), run: ({ editor }) => { editor.chain().focus().undo().run() } },
    { label: 'Ulangi', icon: Redo2, enabled: (editor) => editor.can().redo(), run: ({ editor }) => { editor.chain().focus().redo().run() } },
  ],
]

const toolbarControls = toolbarGroups.flatMap((group, groupIndex) => group.map((action) => ({ ...action, groupIndex })))

const controlClass = 'grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-dark aria-disabled:cursor-not-allowed aria-disabled:opacity-35 aria-disabled:hover:bg-transparent aria-disabled:hover:text-muted'
const activeControlClass = 'bg-white text-primary-dark shadow-sm'
const selectControlClass = 'h-9 rounded-lg border border-transparent bg-transparent pl-2 pr-7 text-xs font-extrabold text-muted transition hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-dark disabled:cursor-not-allowed disabled:opacity-35'

function normalizeLinkHref(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const candidate = /^[a-z][\w+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
  return safeHref(candidate)
}

export function RichTextEditor({ id, label, value, onChange, error, hint, required, maxLength, className }: RichTextEditorProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [focusedControl, setFocusedControl] = useState(0)
  const [linkDraft, setLinkDraft] = useState<string | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)
  const controlRefs = useRef<Array<HTMLButtonElement | null>>([])
  const linkPopoverRef = useRef<HTMLDivElement>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)
  const maximizeButtonRef = useRef<HTMLButtonElement>(null)
  const wasMaximized = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const labelId = `${id}-label`
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const countId = `${id}-count`
  const linkPopoverId = `${id}-link`
  const linkInputId = `${id}-link-url`
  const describedBy = [error ? errorId : hint ? hintId : null, isMaximized ? countId : null].filter(Boolean).join(' ') || undefined
  const isLinkEditorOpen = linkDraft !== null
  const editorClassName = cn(
    'outline-none [&_a]:font-bold [&_a]:text-primary-dark [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-primary/35 [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-cream [&_code]:px-1 [&_h2]:font-extrabold [&_h3]:font-extrabold [&_hr]:my-6 [&_hr]:border-line [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-ink [&_pre]:p-4 [&_pre]:text-white [&_ul]:list-disc [&_ul]:pl-6',
    isMaximized
      ? 'mx-auto w-full max-w-[72ch] px-5 pb-32 pt-10 text-[1.0625rem] leading-[1.9] text-ink [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:leading-tight [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:leading-snug [&_ol]:my-4 [&_p]:my-5 [&_ul]:my-4 sm:px-8'
      : 'min-h-36 px-4 py-3 text-base leading-7 text-ink [&_h2]:text-xl [&_h3]:text-lg [&_p]:my-2',
  )
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, defaultProtocol: 'https', protocols: ['http', 'https'] } }), RichTextTypography],
    content: parseRichText(value),
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        id,
        class: editorClassName,
        'aria-label': label,
      },
    },
    onUpdate: ({ editor: activeEditor }) => onChangeRef.current(JSON.stringify(activeEditor.getJSON())),
  })

  useEffect(() => {
    if (!editor) return
    const next = parseRichText(value)
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(next)) editor.commands.setContent(next, { emitUpdate: false })
  }, [editor, value])

  useEffect(() => {
    if (!isMaximized) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [isMaximized])

  useEffect(() => {
    editor?.setOptions({
      editorProps: {
        attributes: {
          id,
          class: editorClassName,
          'aria-label': label,
          'aria-invalid': error ? 'true' : 'false',
          ...(describedBy ? { 'aria-describedby': describedBy } : {}),
        },
      },
    })
  }, [describedBy, editor, editorClassName, error, id, label])

  useEffect(() => {
    if (isMaximized) editor?.commands.focus()
    else if (wasMaximized.current) maximizeButtonRef.current?.focus()
    wasMaximized.current = isMaximized
  }, [editor, isMaximized])

  useEffect(() => {
    if (!isLinkEditorOpen) return
    linkInputRef.current?.focus()
    linkInputRef.current?.select()
  }, [isLinkEditorOpen])

  useEffect(() => {
    if (!isLinkEditorOpen) return
    const closeOnOutsideInteraction = (event: PointerEvent) => {
      const target = event.target as Node
      if (linkPopoverRef.current?.contains(target)) return
      if (controlRefs.current.some((control) => control?.contains(target))) return
      setLinkDraft(null)
      setLinkError(null)
    }
    document.addEventListener('pointerdown', closeOnOutsideInteraction)
    return () => document.removeEventListener('pointerdown', closeOnOutsideInteraction)
  }, [isLinkEditorOpen])

  const plainText = editor ? editor.getText({ blockSeparator: '\n' }).trim() : richTextToPlainText(value)
  const characterCount = plainText.length
  const wordCount = plainText ? plainText.split(/\s+/).length : 0
  const activeBlockType = editor?.isActive('heading') ? 'heading' : 'paragraph'
  const typographyAttrs = editor?.getAttributes(activeBlockType)
  const currentFontSize = isRichTextTypographyValue('fontSize', typographyAttrs?.fontSize) ? typographyAttrs.fontSize : ''
  const currentLineHeight = isRichTextTypographyValue('lineHeight', typographyAttrs?.lineHeight) ? typographyAttrs.lineHeight : ''

  const updateBlockTypography = (attribute: RichTextTypographyAttribute, nextValue: string) => {
    if (!editor) return
    const activeType = editor.isActive('heading') ? 'heading' : 'paragraph'
    editor.chain().focus().updateAttributes(activeType, { [attribute]: nextValue || null }).run()
  }

  const closeLinkEditor = (restoreFocus: boolean) => {
    setLinkDraft(null)
    setLinkError(null)
    const linkIndex = toolbarControls.findIndex((control) => control.popover)
    if (restoreFocus) controlRefs.current[linkIndex]?.focus()
  }

  const openLinkEditor = () => {
    if (!editor) return
    const href = editor.getAttributes('link').href
    setLinkDraft(typeof href === 'string' ? href : '')
    setLinkError(null)
  }

  const submitLink = () => {
    if (!editor || linkDraft === null) return
    if (!linkDraft.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      closeLinkEditor(false)
      return
    }
    const href = normalizeLinkHref(linkDraft)
    if (!href) {
      setLinkError('Gunakan alamat http atau https yang valid.')
      linkInputRef.current?.focus()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    closeLinkEditor(false)
  }

  const removeLink = () => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run()
    closeLinkEditor(false)
  }

  const focusControl = (index: number) => {
    setFocusedControl(index)
    controlRefs.current[index]?.focus()
  }

  const handleToolbarKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLSelectElement) return
    const total = toolbarControls.length + 1
    if (event.key === 'ArrowRight') focusControl((focusedControl + 1) % total)
    else if (event.key === 'ArrowLeft') focusControl((focusedControl - 1 + total) % total)
    else if (event.key === 'Home') focusControl(0)
    else if (event.key === 'End') focusControl(total - 1)
    else return
    event.preventDefault()
  }

  const handleLinkKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closeLinkEditor(true)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      submitLink()
    }
  }

  const handleSurfaceKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isMaximized || event.key !== 'Escape') return
    event.preventDefault()
    setIsMaximized(false)
  }

  const toolbar = <div className="relative shrink-0 border-b border-line bg-cream/55">
    <div role="toolbar" aria-label={`Pemformatan ${label}`} aria-controls={id} onKeyDown={handleToolbarKeys} className={cn('flex flex-wrap items-center gap-1 p-2', isMaximized && 'mx-auto w-full max-w-[72ch] px-3 sm:px-6')}>
      {toolbarControls.map((control, index) => {
        const Icon = control.icon
        const active = editor ? Boolean(control.active?.(editor)) : false
        const disabled = !editor || (control.enabled ? !control.enabled(editor) : false)
        return <Fragment key={control.label}>
          {index > 0 && control.groupIndex !== toolbarControls[index - 1].groupIndex && <span aria-hidden="true" className="mx-0.5 h-6 w-px self-center bg-line" />}
          <button
            ref={(element) => { controlRefs.current[index] = element }}
            type="button"
            tabIndex={index === focusedControl ? 0 : -1}
            aria-label={control.label}
            title={control.label}
            aria-pressed={control.active ? active : undefined}
            aria-disabled={disabled || undefined}
            aria-haspopup={control.popover ? 'dialog' : undefined}
            aria-expanded={control.popover ? isLinkEditorOpen : undefined}
            aria-controls={control.popover && isLinkEditorOpen ? linkPopoverId : undefined}
            onFocus={() => setFocusedControl(index)}
            onClick={() => { if (editor && !disabled) control.run({ editor, openLinkEditor }) }}
            className={cn(controlClass, active && activeControlClass)}
          ><Icon size={17} aria-hidden="true" /></button>
        </Fragment>
      })}
      <span aria-hidden="true" className="mx-0.5 h-6 w-px self-center bg-line" />
      <select
        aria-label="Ukuran teks"
        title="Ukuran teks"
        value={currentFontSize}
        disabled={!editor}
        onChange={(event) => updateBlockTypography('fontSize', event.target.value)}
        className={cn(selectControlClass, 'w-[7.25rem]')}
      >
        {fontSizeOptions.map((option) => <option key={option.value || 'default'} value={option.value}>{option.label}</option>)}
      </select>
      <select
        aria-label="Jarak baris"
        title="Jarak baris"
        value={currentLineHeight}
        disabled={!editor}
        onChange={(event) => updateBlockTypography('lineHeight', event.target.value)}
        className={cn(selectControlClass, 'w-[6.75rem]')}
      >
        {lineHeightOptions.map((option) => <option key={option.value || 'default'} value={option.value}>{option.label}</option>)}
      </select>
      <span aria-hidden="true" className="mx-0.5 h-6 w-px self-center bg-line" />
      <button
        ref={(element) => { controlRefs.current[toolbarControls.length] = element; maximizeButtonRef.current = element }}
        type="button"
        tabIndex={focusedControl === toolbarControls.length ? 0 : -1}
        title={isMaximized ? 'Perkecil editor (Esc)' : 'Perbesar editor'}
        aria-label={isMaximized ? 'Perkecil editor' : 'Perbesar editor'}
        aria-expanded={isMaximized}
        aria-controls={id}
        onFocus={() => setFocusedControl(toolbarControls.length)}
        onClick={() => setIsMaximized(!isMaximized)}
        className={cn(controlClass, 'ml-auto', isMaximized && activeControlClass)}
      >{isMaximized ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}</button>
    </div>
    {isLinkEditorOpen && <div ref={linkPopoverRef} id={linkPopoverId} role="dialog" aria-label="Tautan" onKeyDown={handleLinkKeys} className="absolute left-2 top-[calc(100%-.25rem)] z-30 grid w-[min(20rem,calc(100vw-2.5rem))] gap-2 rounded-xl border border-line bg-white p-3 shadow-[0_16px_38px_rgba(29,37,34,.14)]">
      <label htmlFor={linkInputId} className="text-xs font-extrabold text-ink">Alamat tautan</label>
      <input
        ref={linkInputRef}
        id={linkInputId}
        type="url"
        inputMode="url"
        placeholder="https://"
        value={linkDraft ?? ''}
        onChange={(event) => { setLinkDraft(event.target.value); setLinkError(null) }}
        aria-invalid={Boolean(linkError)}
        aria-describedby={linkError ? `${linkInputId}-error` : undefined}
        className={cn('min-h-11 w-full rounded-lg border bg-white px-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-primary-dark focus:ring-4 focus:ring-primary/15', linkError ? 'border-error' : 'border-line')}
      />
      {linkError && <p id={`${linkInputId}-error`} role="alert" className="text-xs font-bold text-error">{linkError}</p>}
      <div className="flex justify-end gap-2">
        {editor?.isActive('link') && <button type="button" onClick={removeLink} className="min-h-9 rounded-lg px-3 text-xs font-extrabold text-error transition hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-error">Hapus</button>}
        <button type="button" onClick={() => closeLinkEditor(true)} className="min-h-9 rounded-lg px-3 text-xs font-extrabold text-muted transition hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-dark">Batal</button>
        <button type="button" onClick={submitLink} className="min-h-9 rounded-lg border border-primary-dark bg-primary-dark px-3 text-xs font-extrabold text-white transition hover:border-ink hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark">Simpan</button>
      </div>
    </div>}
  </div>

  if (isMaximized) {
    return <div role="dialog" aria-labelledby={labelId} onKeyDown={handleSurfaceKeys} className="fixed inset-0 z-[100] grid h-[100dvh] grid-rows-[auto_minmax(0,1fr)] bg-white">
      <div className="sticky top-0 z-10 bg-cream/55">
        <div className="mx-auto flex w-full max-w-[72ch] items-baseline justify-between gap-3 px-3 pt-3 sm:px-6">
          <label id={labelId} htmlFor={id} className="text-sm font-extrabold tracking-[-.01em] text-ink">{label}{required && <span aria-hidden="true" className="text-error"> *</span>}</label>
          <p id={countId} className="text-xs text-muted">{wordCount} kata<span aria-hidden="true"> · </span><span className={maxLength && characterCount > maxLength ? 'font-bold text-error' : undefined}>{maxLength ? `${characterCount}/${maxLength} karakter` : `${characterCount} karakter`}</span></p>
        </div>
        {toolbar}
      </div>
      <div className="min-h-0 overflow-y-auto overscroll-contain">
        <EditorContent editor={editor} />
        {hint && !error && <p id={hintId} className="mx-auto w-full max-w-[72ch] px-5 pb-8 text-xs leading-relaxed text-muted sm:px-8">{hint}</p>}
        {error && <p id={errorId} role="alert" className="mx-auto w-full max-w-[72ch] px-5 pb-8 text-xs font-bold text-error sm:px-8">{error}</p>}
      </div>
    </div>
  }

  return <div className={cn('grid gap-2', className)}>
    <div className="flex items-end justify-between gap-3">
      <label id={labelId} htmlFor={id} className="text-sm font-extrabold tracking-[-.01em] text-ink">{label}{required && <span aria-hidden="true" className="text-error"> *</span>}</label>
      {maxLength && <span className={characterCount > maxLength ? 'text-xs font-bold text-error' : 'text-xs text-muted'}>{characterCount}/{maxLength}</span>}
    </div>
    <div className={cn('overflow-hidden rounded-xl border bg-white transition focus-within:border-primary-dark focus-within:ring-4 focus-within:ring-primary/15', error ? 'border-error' : 'border-line')}>
      {toolbar}
      <EditorContent editor={editor} />
    </div>
    {hint && !error && <p id={hintId} className="text-xs leading-relaxed text-muted">{hint}</p>}
    {error && <p id={errorId} role="alert" className="text-xs font-bold text-error">{error}</p>}
  </div>
}
