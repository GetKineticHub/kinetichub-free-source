/**
 * Kinetic Inspector UX Primitives (Global Component)
 * Version: 1.1.0
 *
 * The four pieces every KineticHub block Inspector is built from: a help
 * trigger, a label that carries one, a contextual note, and the FREE-only note
 * naming what the paid edition adds.
 *
 * Extracted verbatim in behaviour from the Scroll Progress implementation,
 * which is the version that was designed against the real inspector and
 * manually verified. Every non-obvious decision below was a bug first; the
 * comments record what broke so the fix is not "simplified" back out.
 *
 * Editor only. Inline styles rather than a stylesheet: block stylesheets are
 * shared with the frontend, and none of this exists there. Nothing here reads
 * runtime state, holds state, registers a listener, or renders a portal of its
 * own -- the platform components do all of that.
 */

import { Button, Dropdown, Notice } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * A compact "?" next to a control label, opening its explanation on click.
 *
 * Dropdown rather than Tooltip: a tooltip is hover-only, so it is unreachable
 * on touch and awkward on a keyboard. Dropdown gives a real button, opens on
 * click, closes on Escape or an outside click, and restores focus to the
 * trigger -- all from the platform, so there is no positioning code, no global
 * listener and no lifecycle of our own here.
 *
 * preventDefault is not optional. Every control renders its label inside a
 * <label htmlFor>, so a plain click on a button placed there would also
 * activate the control it belongs to -- toggling a ToggleControl just to read
 * its help. Stopping the event keeps the trigger to its own job.
 *
 * The accessible name is the control's own name, never a bare "?", so the
 * button is distinguishable when a screen reader lists the controls.
 *
 * @param {Object} props
 * @param {string} props.label Name of the setting, used for the accessible name.
 * @param {string} props.text  The explanation shown in the popover.
 */
export const InspectorHelp = ({ label, text }) => (
    <Dropdown
        focusOnMount
        popoverProps={{ placement: 'left-start', offset: 8 }}
        renderToggle={({ isOpen, onToggle }) => (
            <Button
                size="small"
                variant="tertiary"
                showTooltip={false}
                aria-expanded={isOpen}
                /* translators: %s: name of the setting the help describes. */
                label={sprintf(__('About %s', 'kinetichub'), label)}
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onToggle();
                }}
                /*
                 * An 18px neutral chip: hairline grey ring, near-black glyph,
                 * a 1px lift. `tertiary` contributes no resting decoration of
                 * its own beyond an accent glyph colour, which the explicit
                 * near-black overrides -- so nothing accent-coloured is
                 * painted at rest.
                 *
                 * Nothing here sets a fill. That omission is load-bearing: the
                 * variant's own hover and active rules work by tinting the
                 * fill, and an inline value would outrank them and leave the
                 * control completely inert under the pointer. Leaving it to
                 * the variant buys a real hover for free -- a 4% wash, 8% on
                 * press -- over the white sidebar it sits on.
                 *
                 * Depth is a `filter`, never a `box-shadow`. An inline
                 * box-shadow would win the cascade over
                 * `.components-button:focus`, silently deleting the native
                 * focus ring; `filter` composites over the painted result
                 * instead and leaves every Button state intact.
                 */
                style={{
                    width: '18px',
                    minWidth: '18px',
                    height: '18px',
                    marginLeft: '4px',
                    padding: 0,
                    justifyContent: 'center',
                    borderRadius: '50%',
                    border: '1px solid #ddd',
                    color: '#1e1e1e',
                    fontSize: '11px',
                    fontWeight: 600,
                    lineHeight: 1,
                    filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
                }}
            >
                ?
            </Button>
        )}
        renderContent={() => (
            /*
             * The popover content box is `width: min-content`, so the
             * paragraph's own width sets it. 250px is a comfortable measure
             * for two or three lines; the viewport clamp keeps it inside a
             * narrow window instead of forcing a horizontal scroll.
             */
            <p
                style={{
                    margin: 0,
                    width: '250px',
                    maxWidth: 'calc(100vw - 48px)',
                    fontSize: '12px',
                    lineHeight: 1.5,
                }}
            >
                {text}
            </p>
        )}
    />
);

/**
 * A control label with its help trigger beside it.
 *
 * The "?" shares the label's row instead of adding a line of its own -- the
 * sidebar gets shorter, which is the whole point. Keeping it there once the
 * label is long enough to wrap is the part that needs care.
 *
 * Binding the pair with a no-break space was tried first and failed in the real
 * inspector: the "?" still dropped to a line of its own. Glue characters only
 * suppress breaks BETWEEN CHARACTERS, and the break was never in the text. The
 * trigger is a Button -- an inline-flex box in its own right -- and the line can
 * be broken at the boundary between a text run and an adjacent box like that
 * whatever the last character happened to be. No character can prevent it.
 *
 * What does prevent it is not putting a boundary there. The final word and the
 * trigger go inside one inline-flex box, so they are two items of the same flex
 * line rather than a text run beside a box. Flex items do not wrap by default,
 * so nothing can come between them, and the group behaves as a single unit in
 * the surrounding line: the text before it wraps normally at its own spaces, and
 * when the line runs out the whole group moves down together.
 *
 * `nowrap` is added to the group only when there IS text before it. It stops the
 * short trailing word from breaking mid-word, but on a one-word label the group
 * is the entire label -- and nowrapping a whole label is exactly how a long word
 * in a translation ends up pushed out of the panel. Left off, the group still
 * cannot separate its two items; the word merely wraps inside it, which is the
 * right outcome for a label that has no earlier break opportunity anyway.
 *
 * InspectorHelp is handed the complete original label, never the trailing
 * fragment, so its accessible name is still the setting's full name.
 *
 * @param {string} label The control's full label.
 * @param {string} text  The explanation the "?" opens.
 * @return {JSX.Element} The label, ready to pass to a control's `label` prop.
 */
export const labelWithHelp = (label, text) => {
    /*
     * Split on the last whitespace RUN, not on a single space, so odd spacing in
     * a translation cannot leave the separator behind. The run stays with the
     * prefix, which is what keeps the gap before the group.
     *
     * No match means no whitespace at all -- a one-word label, or a script that
     * does not separate words -- and then there is no prefix and the label is
     * the group.
     */
    const trimmed = String(label).trim();
    const parts = trimmed.match(/^([\s\S]*\s)(\S+)$/);
    const prefix = parts ? parts[1] : '';
    const lastWord = parts ? parts[2] : trimmed;

    return (
        <>
            {prefix}
            <span
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    ...(prefix ? { whiteSpace: 'nowrap' } : {}),
                }}
            >
                {lastWord}
                <InspectorHelp label={label} text={text} />
            </span>
        </>
    );
};

/**
 * A contextual note about the current configuration.
 *
 * The language for things the reader should see WHILE setting a control and
 * would not otherwise discover: why a control is hidden, what a mode implies,
 * what a combination will actually do, what a plan includes. Muted and italic
 * so it reads as commentary on the controls rather than as another control.
 *
 * Deliberately not a warning. Accessibility problems, invalid combinations and
 * broken state keep using the platform's own Notice, which carries the colour,
 * the icon and the semantics an actual problem needs. Nothing here has a status
 * or a role, and that is the distinction: if it needs one, it is not this.
 *
 * @param {Object} props
 * @param {string} props.text The note.
 */
export const InspectorNote = ({ text }) => (
    <p
        style={{
            margin: '-4px 0 16px',
            fontSize: '12px',
            fontStyle: 'italic',
            color: '#64748b',
            lineHeight: 1.5,
        }}
    >
        {text}
    </p>
);

/**
 * The inspector's warning line: a real problem with the current configuration.
 *
 * The counterpart to InspectorNote above, and the distinction is the one that
 * docblock draws -- a note is commentary on a setting, this is a fault in it.
 * So it is the platform's own Notice, which brings the status colour, the icon
 * and the `status` role with it; nothing here reimplements any of that.
 *
 * What it exists for is that every block was writing the same three props by
 * hand, each with a margin of its own (12px in one block, 15px in the next), so
 * the gap under a warning depended on which block you happened to be in. The
 * spacing lives here now and is the same everywhere.
 *
 * Not dismissible by default, and that is the point rather than an oversight:
 * an inspector warning describes state the reader can still see, so dismissing
 * it would hide a condition that has not gone away. A caller with a genuinely
 * transient message can still opt in.
 *
 * For the transient "this runs on the frontend" toast over the canvas, use
 * KineticEditorNotice instead -- that one auto-hides on the next click or
 * keystroke, which is exactly wrong for a condition the reader has to act on.
 *
 * Editor only, no state, no lifecycle, no portal of its own: the same contract
 * as the rest of this module.
 *
 * @param {Object}  props
 * @param {string}  props.status        Notice status. `warning` by default.
 * @param {boolean} props.isDismissible Whether the reader can close it. Off by default.
 * @param {*}       props.children      The message.
 */
export const InspectorNotice = ({ status = 'warning', isDismissible = false, children }) => (
    <Notice status={status} isDismissible={isDismissible} style={{ marginBottom: '12px' }}>
        {children}
    </Notice>
);

/**
 * A one-line note naming capabilities that exist in the paid edition.
 *
 * ---------------------------------------------------------------------------
 * FREE-ONLY CONTRACT -- read before using this component.
 *
 * Every import of ProNote, and every place one is rendered, MUST sit inside a
 * FREE-only build region, delimited with the canonical marker syntax defined
 * by the private release builder. The literal marker tokens are deliberately
 * not spelled out in this public source file; take them from the builder's
 * own marker definitions.
 *
 * At the import, wrap the statement in the bare block-comment marker form:
 *
 *     import { ProNote } from '../../components/InspectorUX';
 *
 * Inside JSX, wrap the element in the braced block-comment marker form:
 *
 *     <ProNote text={ __( '...', 'kinetichub' ) } />
 *
 * A "//" line comment is NOT one of the recognised marker syntaxes. Written
 * that way the region is never stripped and the upsell ships to PRO.
 *
 * A PRO customer must never be shown tier marketing, and compile-time stripping
 * is the only mechanism that guarantees it: the build removes those regions
 * before webpack ever sees them. There is deliberately no runtime check here --
 * no edition flag, no licence lookup -- because a runtime test renders the
 * upsell for anyone the test gets wrong, which is exactly the defect removed
 * from Ambient Aura in 1.1.0.
 *
 * This module itself is not stripped and does not need to be: src/ is removed
 * from the shipped package entirely, so an unused definition never reaches a
 * customer. Only the block-level import and use are load-bearing.
 * ---------------------------------------------------------------------------
 *
 * Placed where the controls it describes would sit, never collected into a
 * single notice at the end of an unrelated panel -- the point is discovery of
 * what a group can do, so it has to read as belonging to the group above it.
 * Roughly one per distinct premium capability, not one per control.
 *
 * Deliberately not a control: no disabled copies of premium settings are
 * rendered, nothing here is clickable, and no link leaves the editor. Plain
 * text is the whole mechanism.
 *
 * Visually separate from InspectorNote, which is the help language for settings
 * that ARE available: that one is italic, this one is upright with the word
 * emphasised. Same muted grey family, so neither competes with a control. The
 * word "PRO" is literal text and carries the meaning on its own, so nothing
 * depends on the weight or the colour being perceived.
 *
 * @param {Object} props
 * @param {string} props.text Sentence naming the capabilities, not a slogan.
 */
export const ProNote = ({ text }) => (
    <p style={{ margin: '-4px 0 16px', fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>
        <strong style={{ fontWeight: 600 }}>{__('PRO', 'kinetichub')}</strong>
        {': '}
        {text}
    </p>
);
