'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot, $insertNodes } from 'lexical'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { Button, Drawer, DrawerToggler, useDrawerSlug, useModal } from '@payloadcms/ui'
import { useCallback, useState } from 'react'

/**
 * WordPress "Text" tab equivalent. The toggler pre-fills a drawer with the
 * document's current HTML (via `$generateHtmlFromNodes`); editors can rewrite
 * it freely and "გამოყენება" re-parses it back into Lexical nodes (via
 * `$generateNodesFromDOM`) and replaces the whole document — same
 * clear-root-then-insert pattern Lexical's own official HTML-import example
 * uses, so switching back to the visual view reflects the edited markup.
 */
function HtmlSourcePlugin() {
  const [editor] = useLexicalComposerContext()
  const drawerSlug = useDrawerSlug('lexical-html-source')
  const { closeModal } = useModal()
  const [html, setHtml] = useState('')

  const openDrawer = useCallback(() => {
    editor.read(() => {
      setHtml($generateHtmlFromNodes(editor, null))
    })
  }, [editor])

  const apply = useCallback(() => {
    editor.update(() => {
      const dom = new DOMParser().parseFromString(html, 'text/html')
      const nodes = $generateNodesFromDOM(editor, dom)
      const root = $getRoot()
      root.clear()
      root.select()
      $insertNodes(nodes)
    })
    closeModal(drawerSlug)
  }, [editor, html, closeModal, drawerSlug])

  return (
    <div style={{ padding: '0 24px' }}>
      <DrawerToggler
        slug={drawerSlug}
        onClick={openDrawer}
        className="html-source-toggle"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          margin: '8px 0',
          padding: '4px 10px',
          fontSize: 13,
          fontFamily: 'monospace',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 4,
          background: 'var(--theme-elevation-50)',
          cursor: 'pointer',
        }}
      >
        {'</>'} HTML
      </DrawerToggler>
      <Drawer slug={drawerSlug} title="HTML კოდის რედაქტირება">
        <p style={{ marginBottom: 12, color: 'var(--theme-elevation-600)' }}>
          დაარედაქტირე HTML კოდი პირდაპირ და დააჭირე „გამოყენება", რომ ცვლილება ტექსტში ჩაისვას.
          გაუქმება — თუ არ სურს ცვლილების შენახვა.
        </p>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={24}
          spellCheck={false}
          style={{
            width: '100%',
            fontFamily: 'monospace',
            fontSize: 13,
            lineHeight: 1.5,
            padding: 12,
            boxSizing: 'border-box',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 4,
            resize: 'vertical',
          }}
        />
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <Button onClick={apply}>გამოყენება</Button>
          <Button buttonStyle="secondary" onClick={() => closeModal(drawerSlug)}>
            გაუქმება
          </Button>
        </div>
      </Drawer>
    </div>
  )
}

export const HtmlSourceFeatureClient = createClientFeature({
  plugins: [
    {
      Component: HtmlSourcePlugin,
      position: 'top',
    },
  ],
})

export default HtmlSourceFeatureClient
