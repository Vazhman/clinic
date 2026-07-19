/**
 * Font-size presets for `TextStateFeature` (wired alongside `textColorStates`
 * / `backgroundColorStates` in `payload.config.ts` and `ColumnsBlock.ts`).
 * `em` units so the size stays relative to the surrounding heading/paragraph
 * context instead of a fixed px value. Deliberately only 4 presets — no
 * free-form px/pt input — per the WordPress-style "preset dropdown" ask.
 *
 * Labelled with a "ზომა:" prefix for the same reason `backgroundColorStates`
 * prefixes with "ფონი:" — TextStateFeature merges every stateKey's options
 * into one flat toolbar dropdown, so the prefix is what keeps size options
 * distinguishable from the color/background swatches sitting next to them.
 */
export const fontSizeStates = {
  'font-size-s': { css: { 'font-size': '0.8em' }, label: 'ზომა: პატარა (S)' },
  'font-size-m': { css: { 'font-size': '1em' }, label: 'ზომა: საშუალო (M)' },
  'font-size-l': { css: { 'font-size': '1.35em' }, label: 'ზომა: დიდი (L)' },
  'font-size-xl': { css: { 'font-size': '1.8em' }, label: 'ზომა: ძალიან დიდი (XL)' },
}
