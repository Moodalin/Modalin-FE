import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { FieldShell, controlClass } from '@/components/ui/field'
import { cn } from '@/components/ui/utils'

export type SelectOption = { value: string; label: string; description?: string; disabled?: boolean }

type SelectProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly SelectOption[]
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  compact?: boolean
  toolbar?: boolean
  labelClassName?: string
}

function findEnabled(options: readonly SelectOption[], start: number, step: number) {
  for (let index = start; index >= 0 && index < options.length; index += step) {
    if (!options[index].disabled) return index
  }
  return -1
}

export function Select({ id, label, value, onChange, options, placeholder = 'Pilih salah satu', error, hint, disabled, required, compact = false, toolbar = false, labelClassName }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [portalStyle, setPortalStyle] = useState<CSSProperties>({})
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLDivElement | null>>([])
  const typeAhead = useRef({ query: '', timer: 0 })
  const listboxId = `${id}-listbox`
  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  const open = (index = selectedIndex >= 0 ? selectedIndex : findEnabled(options, 0, 1)) => {
    if (disabled || options.length === 0) return
    setActiveIndex(index)
    setIsOpen(true)
  }

  const close = (restoreFocus = false) => {
    setIsOpen(false)
    setActiveIndex(-1)
    if (restoreFocus) triggerRef.current?.focus()
  }

  const commit = (index: number) => {
    const option = options[index]
    if (!option || option.disabled) return
    onChange(option.value)
    close(true)
  }

  const move = (index: number) => {
    if (index >= 0) setActiveIndex(index)
  }

  const search = (character: string) => {
    window.clearTimeout(typeAhead.current.timer)
    typeAhead.current.query += character.toLowerCase()
    typeAhead.current.timer = window.setTimeout(() => { typeAhead.current.query = '' }, 600)
    const query = typeAhead.current.query
    const match = options.findIndex((option) => !option.disabled && option.label.toLowerCase().startsWith(query))
    if (match < 0) return
    if (isOpen) setActiveIndex(match)
    else onChange(options[match].value)
  }

  useEffect(() => () => window.clearTimeout(typeAhead.current.timer), [])

  useEffect(() => {
    if (!isOpen) return
    const closeOnOutsideInteraction = (event: PointerEvent) => {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !listboxRef.current?.contains(target)) close(true)
    }
    document.addEventListener('pointerdown', closeOnOutsideInteraction)
    return () => document.removeEventListener('pointerdown', closeOnOutsideInteraction)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !toolbar) return
    const position = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const menuHeight = Math.min(256, options.length * 44 + 8)
      const openAbove = window.innerHeight - rect.bottom < menuHeight && rect.top > menuHeight
      setPortalStyle({ position: 'fixed', left: rect.left, top: openAbove ? rect.top - menuHeight - 6 : rect.bottom + 6, width: Math.max(rect.width, 92) })
    }
    position()
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    return () => { window.removeEventListener('resize', position); window.removeEventListener('scroll', position, true) }
  }, [isOpen, options.length, toolbar])

  useEffect(() => {
    if (!isOpen || activeIndex < 0) return
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [isOpen, activeIndex])

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!isOpen) return open()
      move(findEnabled(options, activeIndex + 1, 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) return open()
      move(findEnabled(options, activeIndex - 1, -1))
    } else if (event.key === 'Home') {
      if (!isOpen) return
      event.preventDefault()
      move(findEnabled(options, 0, 1))
    } else if (event.key === 'End') {
      if (!isOpen) return
      event.preventDefault()
      move(findEnabled(options, options.length - 1, -1))
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!isOpen) return open()
      commit(activeIndex)
    } else if (event.key === 'Escape') {
      if (!isOpen) return
      event.preventDefault()
      close(true)
    } else if (event.key === 'Tab') {
      if (isOpen) close()
    } else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      search(event.key)
    }
  }

  const listbox = <div
    ref={listboxRef}
    id={listboxId}
    role="listbox"
    aria-labelledby={`${id}-label`}
    style={toolbar ? portalStyle : undefined}
    className={cn('absolute inset-x-0 top-[calc(100%+.375rem)] z-50 max-h-64 w-full max-w-full overflow-x-hidden overflow-y-auto overscroll-contain rounded-lg border border-line bg-white p-1 shadow-[0_12px_28px_rgba(29,37,34,.16)]', toolbar && 'fixed inset-x-auto top-auto')}
  >
    {options.map((option, index) => <div
      key={option.value}
      id={`${id}-option-${index}`}
      ref={(element) => { optionRefs.current[index] = element }}
      role="option"
      aria-selected={option.value === value}
      aria-disabled={option.disabled || undefined}
      onPointerUp={() => commit(index)}
      onPointerMove={() => { if (!option.disabled) move(index) }}
      className={cn(
        'flex min-h-11 min-w-0 cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-lg px-3 py-2 text-sm',
        toolbar && 'min-h-9 px-2 py-1.5 text-xs',
        option.value === value ? 'font-extrabold text-primary-dark' : 'font-semibold text-ink',
        index === activeIndex && 'bg-cream',
        option.disabled && 'cursor-not-allowed font-semibold text-muted/70',
      )}
    >
      <span className="min-w-0 flex-1 overflow-hidden">
        <span className="block truncate">{option.label}</span>
        {option.description && <span className="mt-0.5 block truncate text-xs font-medium text-muted">{option.description}</span>}
      </span>
      {option.value === value && <Check size={16} className="shrink-0" aria-hidden="true" />}
    </div>)}
  </div>

  return <FieldShell id={id} label={label} error={error} hint={hint} labelClassName={labelClassName}>
    <div ref={rootRef} className="relative">
      <button
        id={id}
        ref={triggerRef}
        type="button"
        role="combobox"
        disabled={disabled || options.length === 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-activedescendant={isOpen && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        aria-required={required}
        onClick={() => { if (isOpen) close(); else open() }}
        onKeyDown={handleKeyDown}
        className={cn(controlClass, 'flex min-w-0 items-center justify-between gap-3 py-2 text-left disabled:cursor-not-allowed', compact && 'min-h-10 h-10 rounded-lg px-3 text-sm', toolbar && 'h-8 min-h-8 gap-1 rounded-md border-transparent bg-transparent px-2 text-xs font-semibold focus:ring-2 hover:bg-white', error && 'border-error focus:border-error focus:ring-error/15')}
      >
        <span id={`${id}-value`} className={cn('min-w-0 flex-1 truncate', !selected && 'text-muted/70')}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={toolbar ? 14 : 18} aria-hidden="true" className={cn('shrink-0 transition-transform motion-reduce:transition-none', isOpen ? 'rotate-180 text-primary-dark' : 'text-muted')} />
      </button>
      {isOpen && (toolbar ? createPortal(listbox, document.body) : listbox)}
    </div>
  </FieldShell>
}
