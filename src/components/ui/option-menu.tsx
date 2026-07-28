import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'

type Option<T extends string> = { value: T; label: string }

type OptionMenuProps<T extends string> = {
  id: string
  label: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

export function OptionMenu<T extends string>({ id, label, options, value, onChange }: OptionMenuProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const menuId = useId()
  const labelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const selected = options[selectedIndex]

  const focusOption = (index: number) => {
    setActiveIndex(index)
    requestAnimationFrame(() => optionRefs.current[index]?.focus())
  }
  const openMenu = (index = selectedIndex) => {
    setIsOpen(true)
    focusOption(index)
  }
  const closeMenu = (restoreFocus = false) => {
    setIsOpen(false)
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus())
  }
  const selectOption = (option: T) => {
    onChange(option)
    closeMenu(true)
  }

  useEffect(() => {
    if (!isOpen) return
    const closeOnOutsideInteraction = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeMenu()
    }
    document.addEventListener('pointerdown', closeOnOutsideInteraction)
    return () => document.removeEventListener('pointerdown', closeOnOutsideInteraction)
  }, [isOpen])

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      openMenu(Math.min(selectedIndex + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      openMenu(Math.max(selectedIndex - 1, 0))
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (isOpen) closeMenu()
      else openMenu()
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault()
      closeMenu(true)
    }
  }

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = optionRefs.current.indexOf(document.activeElement as HTMLButtonElement)
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusOption(Math.min(Math.max(currentIndex, 0) + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusOption(Math.max(currentIndex - 1, 0))
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusOption(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusOption(options.length - 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (currentIndex >= 0) selectOption(options[currentIndex].value)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu(true)
    } else if (event.key === 'Tab') {
      closeMenu()
    }
  }

  return <div ref={rootRef} className="relative grid gap-2">
    <span id={labelId} className="text-sm font-extrabold tracking-[-.01em] text-ink">{label}</span>
    <button id={id} ref={triggerRef} type="button" aria-haspopup="menu" aria-expanded={isOpen} aria-controls={menuId} aria-labelledby={labelId} onClick={() => { if (isOpen) closeMenu(); else openMenu() }} onKeyDown={handleTriggerKeyDown} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 text-left text-base text-ink outline-none transition hover:border-primary-dark focus:border-primary-dark focus:ring-4 focus:ring-primary/15">
      <span className="truncate">{selected.label}</span>
      <ChevronDown size={18} className={isOpen ? 'shrink-0 rotate-180 text-primary-dark transition-transform' : 'shrink-0 text-muted transition-transform'} aria-hidden="true" />
    </button>
    {isOpen && <div id={menuId} role="menu" aria-labelledby={labelId} className="absolute inset-x-0 top-[calc(100%+.5rem)] z-20 overflow-hidden rounded-xl border border-line bg-white p-1 shadow-[0_16px_38px_rgba(29,37,34,.14)]" onKeyDown={handleMenuKeyDown}>
      {options.map((option, index) => <button key={option.value} ref={(element) => { optionRefs.current[index] = element }} tabIndex={index === activeIndex ? 0 : -1} type="button" role="menuitemradio" aria-checked={option.value === value} onClick={() => selectOption(option.value)} className={option.value === value ? 'flex min-h-10 w-full items-center justify-between gap-3 rounded-lg bg-primary/10 px-3 text-left text-sm font-extrabold text-primary-dark' : 'flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm font-semibold text-ink hover:bg-cream focus:bg-cream focus:outline-none'}>
        <span>{option.label}</span>
        {option.value === value && <Check size={16} aria-hidden="true" />}
      </button>)}
    </div>}
  </div>
}
