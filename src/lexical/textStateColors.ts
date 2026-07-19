import { defaultColors } from '@payloadcms/richtext-lexical'

/**
 * Payload's TextStateFeature always merges every configured stateKey into a
 * single flat toolbar dropdown (see feature.client.js — one `key: 'textState'`
 * group with all stateValues concatenated). That means a plain
 * `{ ...defaultColors.text, ...defaultColors.background }` config would show
 * two "Red" entries, two "Blue" entries, etc. with no way to tell which one
 * sets text color vs background color just by reading the dropdown.
 *
 * We keep them as separate stateKeys (`color` / `bgColor`, wired in
 * payload.config.ts and ColumnsBlock.ts) so both can be applied to the same
 * text independently, and relabel the background half with a "ფონი:" prefix
 * so the single merged dropdown stays unambiguous.
 */
export const textColorStates = defaultColors.text

export const backgroundColorStates = Object.fromEntries(
  Object.entries(defaultColors.background).map(([key, value]) => [
    key,
    { ...value, label: `ფონი: ${value.label}` },
  ]),
)
