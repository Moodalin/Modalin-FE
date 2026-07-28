import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { FieldShell, controlClass } from '@/components/ui/field'
import { cn } from '@/components/ui/utils'

export type SelectOption = { value: string; label: string; description?: string; disabled?: boolean }

type SelectProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
}

function findEnabled(options: SelectOption[], start: number, step: number) {
  for (let index = start; index >= 0 && index < options.length; index += step) {
    if (!options[index].disabled) return index
  }
  return -1
}

export function Select({ id, label, value, onChange, options, placeholder = 'Pilih salah satu', error, hint, disabled, required }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
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
      if (!rootRef.current?.contains(event.target as Node)) close(true)
    }
    document.addEventListener('pointerdown', closeOnOutsideInteraction)
    return () => document.removeEventListener('pointerdown', closeOnOutsideInteraction)
  }, [isOpen])

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

  return <FieldShell id={id} label={label} error={error} hint={hint}>
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
        className={cn(controlClass, 'flex items-center justify-between gap-3 py-2 text-left disabled:cursor-not-allowed', error && 'border-error focus:border-error focus:ring-error/15')}
      >
        <span id={`${id}-value`} className={cn('truncate', !selected && 'text-muted/70')}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={18} aria-hidden="true" className={cn('shrink-0 transition-transform motion-reduce:transition-none', isOpen ? 'rotate-180 text-primary-dark' : 'text-muted')} />
      </button>
      {isOpen && <div
        id={listboxId}
        role="listbox"
        aria-labelledby={`${id}-label`}
        className="absolute inset-x-0 top-[calc(100%+.375rem)] z-30 max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-line bg-white p-1 shadow-[0_16px_38px_rgba(29,37,34,.14)]"
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
            'flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm',
            option.value === value ? 'font-extrabold text-primary-dark' : 'font-semibold text-ink',
            index === activeIndex && 'bg-cream',
            option.disabled && 'cursor-not-allowed font-semibold text-muted/70',
          )}
        >
          <span className="min-w-0">
            <span className="block truncate">{option.label}</span>
            {option.description && <span className="mt-0.5 block truncate text-xs font-medium text-muted">{option.description}</span>}
          </span>
          {option.value === value && <Check size={16} className="shrink-0" aria-hidden="true" />}
        </div>)}
      </div>}
    </div>
  </FieldShell>
}
