/**
 * Kinetic Scroll Progress - Editor Interface
 * Version: 1.0.0
 *
 * The canvas preview is intentionally static: it renders a fixed mock value so
 * the configuration is readable while editing. No scroll listeners, timers or
 * frame loops run in the editor.
 */

import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import { PanelBody, RangeControl, SelectControl, ToggleControl, Button, Dropdown } from '@wordpress/components';

import { __, sprintf } from '@wordpress/i18n';
import { KineticVisibilityControls } from '../../components/VisibilityControls';
import metadata from './block.json';

const progressIcon = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="9" width="18" height="6" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M6 12H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;

/**
 * A compact "?" next to a control label, opening its explanation on click.
 *
 * Editor only, and the single implementation for every control in this block --
 * FREE and PRO alike, which is why it sits outside the premium regions.
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
 */
const InspectorHelp = ({ label, text }) => (
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
                 * Depth is a `filter`, never a `boxShadow`. An inline
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
 */
const labelWithHelp = (label, text) => {
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
 * A one-line note naming capabilities that exist in the commercial edition.
 *
 * Placed where the controls it describes would sit, never collected into a
 * single notice at the end of an unrelated panel -- the point is discovery of
 * what a group can do, so it has to read as belonging to the group above it.
 *
 * Deliberately not a control: no disabled copies of premium settings are
 * rendered, nothing here is clickable, and no link leaves the editor. Plain
 * text is the whole mechanism.
 *
 * Visually separate from `.kh-sp-inspector-note`, which is the help language
 * for settings that ARE available: that one is italic, this one is upright
 * with the word emphasised. Same muted grey, so neither competes with a
 * control. The word "PRO" is literal text and carries the meaning on its own,
 * so nothing depends on the weight or the colour being perceived.
 *
 * Inline styles rather than a class: the block's stylesheet is shared with the
 * frontend, and this exists only in the editor, only in this build.
 */
const ProNote = ({ text }) => (
    <p style={{ margin: '-4px 0 16px', fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>
        <strong style={{ fontWeight: 600 }}>{__('PRO', 'kinetichub')}</strong>
        {': '}
        {text}
    </p>
);


/*
 * Mock fill used by the canvas preview only. Deliberately not a shared or
 * documented value: the runtime writes the real normalized progress.
 */
const PREVIEW_PROGRESS = 0.62;
const PREVIEW_MILESTONE_COUNT = 5;

/*
 * Mock heading levels for the canvas preview. Shaped like a real journey so
 * Major Headings Only has something to demonstrate, and so the staggered rows
 * alternate visibly in both modes.
 */
const PREVIEW_LEVELS = [2, 3, 3, 2, 3];

const buildPreviewMilestones = (count) => {
    const total = Math.max(2, Math.min(PREVIEW_MILESTONE_COUNT, count));
    const items = [];
    let majorIndex = 0;

    for (let index = 0; index < total; index++) {
        const level = PREVIEW_LEVELS[index] === 3 ? 3 : 2;

        if (level !== 3) {
            majorIndex++;
        }

        items.push({
            position: (index + 1) / (total + 1),
            level: level,
            // Mirrors the runtime: top-level items carry their own sequence
            // parity so the staggered preview alternates the same way.
            majorIndex: majorIndex,
            label: level === 3
                ? `${__('Detail', 'kinetichub')} ${index + 1}`
                : `${__('Section', 'kinetichub')} ${index + 1}`,
        });
    }

    return items;
};

/**
 * Frontend-equivalent class list for one preview milestone.
 */
const previewMilestoneClasses = (milestone) => {
    if (milestone.level === 3) {
        return 'is-minor';
    }

    return 'is-major ' + (milestone.majorIndex % 2 === 1 ? 'is-major-odd' : 'is-major-even');
};

/**
 * Mirrors the frontend rule for the preview: the current milestone is the last
 * one the mock value has already passed.
 */
const previewMilestoneState = (milestone, next) => {
    if (milestone.position > PREVIEW_PROGRESS) {
        return 'is-upcoming';
    }

    if (!next || next.position > PREVIEW_PROGRESS) {
        return 'is-current';
    }

    return 'is-completed';
};

registerBlockType(metadata.name, {
    icon: progressIcon,
    edit: (props) => {
        const { attributes, setAttributes } = props;
        const {
            presentation, position, thickness, thicknessMobile,
            lengthPercent, lengthPercentMobile,
            edgeOffset, edgeOffsetMobile, zIndex, headerOffset,
            trackColor, trackOpacity, progressColor, progressOpacity, borderRadius,
            direction, smoothing,
            enableMilestones, headingLevels, maxMilestones,
            headingLevelsMobile, maxMilestonesMobile, showLabels,
            labelsDesktop, labelsMobile, horizontalLabelLayout,
            markerStyle, activeColor, inactiveColor,
            labelBackground, labelBackgroundColor, syncLabelBackgroundWithProgress,
        } = attributes;

        

        /*
         * The effective presentation, never the stored one. A block saved with
         * a premium presentation and reopened without it must fall back to a
         * supported value for display, exactly as the server does, and must not
         * have that fallback written back over the author's saved choice.
         */
        let presentationOptions = [
            { label: __('Horizontal Bar', 'kinetichub'), value: 'horizontal' },
            { label: __('Vertical Rail', 'kinetichub'), value: 'vertical' },
        ];

        let editorPresentation = presentation === 'vertical' ? 'vertical' : 'horizontal';

        /*
         * Whether this block can occupy the top edge of the screen, which is the
         * only place a site header can be in the way. A vertical rail runs down a
         * side and is deliberately not counted.
         *
         * Gating the control on this, rather than on the stored presentation
         * alone, is what keeps "Clear Site Header" out of the panel for a bar
         * pinned to the bottom -- and hiding it never writes, so the setting
         * survives a trip through another presentation untouched.
         */
        let topEdgeReachable = editorPresentation === 'horizontal' && position === 'top';

        

        const isHorizontal = presentation !== 'vertical';

        let positionOptions = isHorizontal
            ? [
                { label: __('Top', 'kinetichub'), value: 'top' },
                { label: __('Bottom', 'kinetichub'), value: 'bottom' },
            ]
            : [
                { label: __('Left', 'kinetichub'), value: 'left' },
                { label: __('Right', 'kinetichub'), value: 'right' },
            ];

        

        /*
         * Switching orientation must never leave an impossible pair stored. The
         * server coerces defensively too, but fixing it here keeps the preview
         * and the saved attributes in step.
         */
        const onPresentationChange = (value) => {
            

            const nextIsHorizontal = value !== 'vertical';
            const validPositions = nextIsHorizontal ? ['top', 'bottom'] : ['left', 'right'];
            const nextPosition = validPositions.includes(position)
                ? position
                : validPositions[0];

            setAttributes({ presentation: value, position: nextPosition });
        };

        const previewMilestones = enableMilestones
            ? buildPreviewMilestones(maxMilestones)
            : [];

        const previewVars = {
            '--kh-sp-size-desk': `${thickness}px`,
            '--kh-sp-length-desk': isHorizontal ? `${lengthPercent}%` : '100%',
            '--kh-sp-track-c': trackColor || '#111827',
            '--kh-sp-track-o': trackOpacity,
            '--kh-sp-fill-c': progressColor || '#10b981',
            '--kh-sp-fill-o': progressOpacity,
            '--kh-sp-radius': `${borderRadius}px`,
            '--kh-sp-ms-active': activeColor || '#10b981',
            '--kh-sp-ms-inactive': inactiveColor || '#9ca3af',
            '--kh-sp-progress': PREVIEW_PROGRESS,
            // Mirrors the server: emitted only once a plate is actually drawn.
            ...(enableMilestones && showLabels && labelBackground !== 'none'
                ? { '--kh-sp-ms-label-bg': labelBackgroundColor || '#111827' }
                : {}),
            
        };

        /*
         * Which orientation the preview shell renders as. Segmented resolves it
         * from the edge; Ring replaces it outright.
         */
        let previewOrientation = isHorizontal ? 'kh-sp-preview-horizontal' : 'kh-sp-preview-vertical';

        

        const previewClasses = [
            'kh-sp-preview',
            previewOrientation,
            
            `pos-${position}`,
            direction === 'reverse' ? 'is-reversed' : '',
            enableMilestones ? `marker-${markerStyle}` : '',
            enableMilestones && !showLabels ? 'labels-off' : '',
            enableMilestones && showLabels ? `labels-desk-${labelsDesktop}` : '',
            enableMilestones && showLabels ? `labels-layout-${horizontalLabelLayout}` : '',
            // Mirrors the server: "none" is the absence of a class, not a class.
            enableMilestones && showLabels && labelBackground !== 'none'
                ? `labels-bg-${labelBackground}`
                : '',
            enableMilestones && showLabels && labelBackground !== 'none' && syncLabelBackgroundWithProgress
                ? 'labels-bg-sync'
                : '',
        ].filter(Boolean).join(' ');

        const blockProps = useBlockProps({
            className: 'kh-sp-editor-shell-wrap',
        });

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('📊 Progress', 'kinetichub')} initialOpen={true}>
                        <SelectControl
                            label={__('Presentation', 'kinetichub')}
                            value={editorPresentation}
                            options={presentationOptions}
                            onChange={onPresentationChange}
                        />
                        
                        {/* Exactly where the two further presentations, and the
                          * mobile override that follows them, would be chosen. */}
                        <ProNote
                            text={__('Floating Ring and Segmented Progress presentations, plus a separate presentation for mobile.', 'kinetichub')}
                        />
                        
                        
                        <SelectControl
                            label={__('Screen Position', 'kinetichub')}
                            value={position}
                            options={positionOptions}
                            onChange={(v) => setAttributes({ position: v })}
                        />
                        
                        <SelectControl
                            label={__('Direction', 'kinetichub')}
                            value={direction}
                            options={[
                                { label: isHorizontal ? __('Left to Right', 'kinetichub') : __('Top to Bottom', 'kinetichub'), value: 'normal' },
                                { label: isHorizontal ? __('Right to Left', 'kinetichub') : __('Bottom to Top', 'kinetichub'), value: 'reverse' },
                            ]}
                            onChange={(v) => setAttributes({ direction: v })}
                        />
                        <SelectControl
                            label={labelWithHelp(__('Smoothing', 'kinetichub'), __('How softly the indicator follows the scroll position.', 'kinetichub'))}
                            value={smoothing}
                            options={[
                                { label: __('None (Exact)', 'kinetichub'), value: 'none' },
                                { label: __('Subtle', 'kinetichub'), value: 'subtle' },
                                { label: __('Smooth', 'kinetichub'), value: 'smooth' },
                            ]}
                            onChange={(v) => setAttributes({ smoothing: v })}
                        />
                        
                        {/* The last control in this panel either way: what the
                          * indicator measures is chosen right here. */}
                        <ProNote
                            text={__('Progress Source — measure a parent section or a custom CSS selector instead of the whole page.', 'kinetichub')}
                        />
                        
                        
                    </PanelBody>

                    <PanelBody title={__('📐 Size & Position', 'kinetichub')} initialOpen={false}>
                        
                        <RangeControl
                            label={__('Thickness (px)', 'kinetichub')}
                            value={thickness}
                            onChange={(v) => setAttributes({ thickness: v })}
                            min={1}
                            max={24}
                        />
                        <RangeControl
                            label={labelWithHelp(__('Thickness on Mobile (px)', 'kinetichub'), __('Applied at 768px and below, where a thinner indicator covers less content.', 'kinetichub'))}
                            value={thicknessMobile}
                            onChange={(v) => setAttributes({ thicknessMobile: v })}
                            min={1}
                            max={24}
                        />
                        
                        
                        <RangeControl
                            label={isHorizontal ? __('Width (%)', 'kinetichub') : __('Height (%)', 'kinetichub')}
                            value={lengthPercent}
                            onChange={(v) => setAttributes({ lengthPercent: v })}
                            min={10}
                            max={100}
                        />
                        <RangeControl
                            label={isHorizontal ? __('Width on Mobile (%)', 'kinetichub') : __('Height on Mobile (%)', 'kinetichub')}
                            value={lengthPercentMobile}
                            onChange={(v) => setAttributes({ lengthPercentMobile: v })}
                            min={10}
                            max={100}
                            help={__('Applied at 768px and below. The canvas preview always shows the desktop value.', 'kinetichub')}
                        />
                        
                        {topEdgeReachable && (
                            <ToggleControl
                                label={labelWithHelp(__('Clear Site Header', 'kinetichub'), __('Keeps a top-edge indicator below the site header and follows it as it scrolls away. Distance from Edge still applies as the minimum clearance.', 'kinetichub'))}
                                checked={headerOffset !== 'off'}
                                onChange={(v) => setAttributes({ headerOffset: v ? 'auto' : 'off' })}
                            />
                        )}
                        <RangeControl
                            label={labelWithHelp(__('Distance from Edge (px)', 'kinetichub'), __('Push the indicator away from its screen edge, for example to clear a sticky header.', 'kinetichub'))}
                            value={edgeOffset}
                            onChange={(v) => setAttributes({ edgeOffset: v })}
                            min={0}
                            max={200}
                        />
                        <RangeControl
                            label={labelWithHelp(__('Distance from Edge on Mobile (px)', 'kinetichub'), __('Mobile headers are usually a different height. Device safe areas are added automatically.', 'kinetichub'))}
                            value={edgeOffsetMobile}
                            onChange={(v) => setAttributes({ edgeOffsetMobile: v })}
                            min={0}
                            max={200}
                        />
                        <RangeControl
                            label={labelWithHelp(__('Layer (z-index)', 'kinetichub'), __('Lower this if the indicator covers a header or banner.', 'kinetichub'))}
                            value={zIndex}
                            onChange={(v) => setAttributes({ zIndex: v })}
                            min={1}
                            max={9999}
                        />
                    </PanelBody>

                    <PanelBody title={__('🎨 Colors & Shape', 'kinetichub')} initialOpen={false}>
                        <PanelColorSettings
                            title={__('Indicator Colors', 'kinetichub')}
                            initialOpen={true}
                            colorSettings={[
                                {
                                    value: trackColor,
                                    onChange: (v) => setAttributes({ trackColor: v || '#111827' }),
                                    label: __('Track', 'kinetichub'),
                                },
                                {
                                    value: progressColor,
                                    onChange: (v) => setAttributes({ progressColor: v || '#10b981' }),
                                    label: __('Progress', 'kinetichub'),
                                },
                            ]}
                        />
                        <RangeControl
                            label={__('Track Opacity', 'kinetichub')}
                            value={trackOpacity}
                            onChange={(v) => setAttributes({ trackOpacity: v })}
                            min={0}
                            max={1}
                            step={0.05}
                        />
                        <RangeControl
                            label={__('Progress Opacity', 'kinetichub')}
                            value={progressOpacity}
                            onChange={(v) => setAttributes({ progressOpacity: v })}
                            min={0}
                            max={1}
                            step={0.05}
                        />
                        
                        <RangeControl
                            label={__('Border Radius (px)', 'kinetichub')}
                            value={borderRadius}
                            onChange={(v) => setAttributes({ borderRadius: v })}
                            min={0}
                            max={50}
                        />
                        
                    </PanelBody>

                    
                    <PanelBody title={__('🚩 Milestones', 'kinetichub')} initialOpen={false}>
                        
                        <ToggleControl
                            label={labelWithHelp(__('Enable Milestones', 'kinetichub'), __('Marks points along the indicator using the headings found in the page content.', 'kinetichub'))}
                            checked={!!enableMilestones}
                            onChange={(v) => setAttributes({ enableMilestones: !!v })}
                        />

                        {enableMilestones && (
                            <>
                                
                                {/* Where the journey's source is chosen, and only
                                  * once there is a journey to source. */}
                                <ProNote
                                    text={__('Manual Milestones — build the journey yourself instead of following the page headings.', 'kinetichub')}
                                />
                                
                                
                                <SelectControl
                                    label={__('Heading Levels — Desktop', 'kinetichub')}
                                    value={headingLevels}
                                    options={[
                                        { label: __('H2 only', 'kinetichub'), value: 'h2' },
                                        { label: __('H2 and H3', 'kinetichub'), value: 'h2h3' },
                                    ]}
                                    onChange={(v) => setAttributes({ headingLevels: v })}
                                />
                                <RangeControl
                                    label={labelWithHelp(__('Maximum Milestones — Desktop', 'kinetichub'), __('Caps how many markers are shown. When a page has more headings than this, markers are spread evenly across it and the first and last heading are always kept.', 'kinetichub'))}
                                    value={maxMilestones}
                                    onChange={(v) => setAttributes({ maxMilestones: v })}
                                    min={3}
                                    max={30}
                                />
                                <SelectControl
                                    label={labelWithHelp(__('Heading Levels — Mobile', 'kinetichub'), __('Applied at 768px and below. Use fewer heading levels or a lower maximum on mobile to keep the journey compact.', 'kinetichub'))}
                                    value={headingLevelsMobile}
                                    options={[
                                        { label: __('H2 only', 'kinetichub'), value: 'h2' },
                                        { label: __('H2 and H3', 'kinetichub'), value: 'h2h3' },
                                    ]}
                                    onChange={(v) => setAttributes({ headingLevelsMobile: v })}
                                />
                                <RangeControl
                                    label={labelWithHelp(__('Maximum Milestones — Mobile', 'kinetichub'), __('Applied at 768px and below, where fewer markers stay readable. Sampling works the same way, keeping the first and last heading.', 'kinetichub'))}
                                    value={maxMilestonesMobile}
                                    onChange={(v) => setAttributes({ maxMilestonesMobile: v })}
                                    min={3}
                                    max={30}
                                />
                                
                                <SelectControl
                                    label={__('Marker Style', 'kinetichub')}
                                    value={markerStyle}
                                    options={[
                                        { label: __('Dot', 'kinetichub'), value: 'dot' },
                                        { label: __('Tick', 'kinetichub'), value: 'tick' },
                                    ]}
                                    onChange={(v) => setAttributes({ markerStyle: v })}
                                />
                                <ToggleControl
                                    label={__('Show Labels', 'kinetichub')}
                                    checked={!!showLabels}
                                    onChange={(v) => setAttributes({ showLabels: !!v })}
                                />

                                {showLabels && (
                                    <>
                                        
                                        <SelectControl
                                            label={labelWithHelp(__('Labels on Desktop', 'kinetichub'), __('For dense horizontal journeys, try Major Headings Only, Current Only, Staggered Labels, or reduce Maximum Milestones.', 'kinetichub'))}
                                            value={labelsDesktop}
                                            options={[
                                                { label: __('Show all', 'kinetichub'), value: 'show' },
                                                { label: __('Major headings only', 'kinetichub'), value: 'major' },
                                                { label: __('Current only', 'kinetichub'), value: 'current' },
                                                { label: __('Hide', 'kinetichub'), value: 'hide' },
                                            ]}
                                            onChange={(v) => setAttributes({ labelsDesktop: v })}
                                        />

                                        {labelsDesktop === 'major' && (
                                            <p className="kh-sp-inspector-note">
                                                {__('H2 labels remain visible while H3 milestones stay as markers.', 'kinetichub')}
                                            </p>
                                        )}

                                        {isHorizontal && (labelsDesktop === 'show' || labelsDesktop === 'major') && (
                                            <SelectControl
                                                label={labelWithHelp(__('Horizontal Label Layout', 'kinetichub'), __('Staggered alternates labels above and below the bar and nudges the bar inward to make room, so neighbouring labels never sit side by side.', 'kinetichub'))}
                                                value={horizontalLabelLayout}
                                                options={[
                                                    { label: __('Standard', 'kinetichub'), value: 'standard' },
                                                    { label: __('Staggered', 'kinetichub'), value: 'staggered' },
                                                ]}
                                                onChange={(v) => setAttributes({ horizontalLabelLayout: v })}
                                            />
                                        )}

                                        <SelectControl
                                            label={labelWithHelp(__('Labels on Mobile', 'kinetichub'), __('Narrow screens rarely fit every label. Current only is the default: it keeps one label readable without changing the layout.', 'kinetichub'))}
                                            value={labelsMobile}
                                            options={[
                                                { label: __('Show all', 'kinetichub'), value: 'show' },
                                                { label: __('Major headings only', 'kinetichub'), value: 'major' },
                                                { label: __('Current only', 'kinetichub'), value: 'current' },
                                                { label: __('Hide', 'kinetichub'), value: 'hide' },
                                            ]}
                                            onChange={(v) => setAttributes({ labelsMobile: v })}
                                        />

                                        {labelsMobile === 'major' && (
                                            <p className="kh-sp-inspector-note">
                                                {__('H2 labels remain visible while H3 milestones stay as markers.', 'kinetichub')}
                                            </p>
                                        )}
                                        

                                        <SelectControl
                                            label={labelWithHelp(__('Milestone Label Background', 'kinetichub'), __('Draws a plate behind the label text, for pages where the content underneath makes labels hard to read.', 'kinetichub'))}
                                            value={labelBackground}
                                            options={[
                                                { label: __('None', 'kinetichub'), value: 'none' },
                                                { label: __('Box', 'kinetichub'), value: 'box' },
                                                { label: __('Rounded', 'kinetichub'), value: 'rounded' },
                                                { label: __('Pill', 'kinetichub'), value: 'pill' },
                                            ]}
                                            onChange={(v) => setAttributes({ labelBackground: v })}
                                        />

                                        {labelBackground !== 'none' && (
                                            <ToggleControl
                                                label={labelWithHelp(__('Sync Background with Progress', 'kinetichub'), __('Use the track color for upcoming labels and the progress color for reached labels.', 'kinetichub'))}
                                                checked={!!syncLabelBackgroundWithProgress}
                                                onChange={(v) => setAttributes({ syncLabelBackgroundWithProgress: !!v })}
                                            />
                                        )}

                                        {labelBackground !== 'none' && (
                                            <p className="kh-sp-inspector-note">
                                                {syncLabelBackgroundWithProgress
                                                    ? __('Backgrounds follow your Track and Progress colors. Check both contrast with your milestone text colors.', 'kinetichub')
                                                    : __('Pick a background that contrasts with your milestone text colors so the labels stay readable.', 'kinetichub')}
                                            </p>
                                        )}
                                    </>
                                )}

                                
                                
                                {/* The same seat the navigation toggle takes: after
                                  * the journey is described, before it is coloured. */}
                                <ProNote
                                    text={__('Milestone Navigation — let visitors select a milestone to jump to its section.', 'kinetichub')}
                                />
                                

                                <PanelColorSettings
                                    title={__('Milestone Colors', 'kinetichub')}
                                    initialOpen={false}
                                    colorSettings={[
                                        {
                                            value: activeColor,
                                            onChange: (v) => setAttributes({ activeColor: v || '#10b981' }),
                                            label: __('Reached', 'kinetichub'),
                                        },
                                        {
                                            value: inactiveColor,
                                            onChange: (v) => setAttributes({ inactiveColor: v || '#9ca3af' }),
                                            label: __('Not reached', 'kinetichub'),
                                        },
                                        // Only once there is a plate to colour, and only while its
                                        // colour is still a manual choice. Spread rather than
                                        // rendered conditionally so the two existing controls keep
                                        // their exact behaviour either way. Hidden, never cleared:
                                        // the stored colour returns if sync is switched back off.
                                        ...(showLabels && labelBackground !== 'none' && !syncLabelBackgroundWithProgress
                                            ? [{
                                                value: labelBackgroundColor,
                                                onChange: (v) => setAttributes({ labelBackgroundColor: v || '#111827' }),
                                                label: __('Label Background', 'kinetichub'),
                                            }]
                                            : []),
                                    ]}
                                />
                            </>
                        )}
                    </PanelBody>
                    

                    

                    
                    {/*
                      * The one place a panel-level note is the honest shape: the
                      * whole family is premium, so there is no control for the
                      * note to sit under. It takes the seat the real panel takes,
                      * between Milestones and Visibility, and stays collapsed --
                      * a reader who opens it is asking what is in there, and the
                      * sidebar is no longer for anyone who is not.
                      */}
                    <PanelBody title={__('✨ Smart Addons', 'kinetichub')} initialOpen={false}>
                        <ProNote
                            text={__('Progress Glow, Active Label Emphasis, Current Milestone Pulse, Completed Milestone Style, Dual Ring, and Ring Center Content.', 'kinetichub')}
                        />
                    </PanelBody>
                    

                    <KineticVisibilityControls attributes={attributes} setAttributes={setAttributes} />
                </InspectorControls>

                <div {...blockProps}>
                    <div className="kh-sp-editor-shell">
                        <div className={previewClasses} style={previewVars}>
                            <div className="kh-sp-track">
                                <div className="kh-sp-fill"></div>
                            </div>

                            

                            {enableMilestones && (
                                <ol className="kh-sp-milestones">
                                    {previewMilestones.map((milestone, index) => (
                                        <li
                                            key={index}
                                            className={`kh-sp-milestone ${previewMilestoneState(milestone, previewMilestones[index + 1])} ${previewMilestoneClasses(milestone)}`}
                                            style={{ '--kh-sp-ms-pos': milestone.position }}
                                        >
                                            <span className="kh-sp-ms-marker"></span>
                                            {showLabels && (
                                                <span className="kh-sp-ms-label">{milestone.label}</span>
                                            )}
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    </div>
                    <p className="kh-sp-editor-hint">
                        {__('Preview only — the indicator is fixed to the screen edge and tracks scrolling on the frontend.', 'kinetichub')}
                    </p>
                </div>
            </>
        );
    },
    save: () => null,
});
