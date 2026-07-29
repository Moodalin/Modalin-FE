/// <reference types="node" />
import assert from 'node:assert/strict'
import test from 'node:test'
import { getRichTextTypographyHTMLAttributes } from './rich-text-typography.ts'

test('combines font size and line height into one editor style attribute', () => {
  assert.deepEqual(
    getRichTextTypographyHTMLAttributes({ fontSize: '18px', lineHeight: '1.5' }),
    { style: 'font-size: 18px; line-height: 1.5' },
  )
})

test('accepts a safe manually entered font size', () => {
  assert.deepEqual(getRichTextTypographyHTMLAttributes({ fontSize: '22px' }), { style: 'font-size: 22px' })
})

test('omits typography declarations outside the allowlist', () => {
  assert.deepEqual(
    getRichTextTypographyHTMLAttributes({ fontSize: 'calc(1px + 1vw)', lineHeight: 'url(test)' }),
    {},
  )
})

