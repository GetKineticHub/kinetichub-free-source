/**
 * Kinetic Typography - Editor Interface
 * Version: 1.0.0
 */

import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, RichText, InspectorControls, ColorPalette } from '@wordpress/block-editor';
import {
    PanelBody,
    SelectControl,
    RangeControl,
    ToggleControl,
    BaseControl,
    Button,
    __experimentalDivider as Divider
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { InspectorNotice, labelWithHelp } from '../../components/InspectorUX';

import { ProNote } from '../../components/InspectorUX';



import { KineticEditorNotice } from '../../components/EditorNotice';

import metadata from './block.json';

registerBlockType(metadata.name, {
    icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 7H19M12 7V19M8 11L12 15L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 7V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 2"/>
        </svg>
    ),

    edit: ({ attributes, setAttributes, isSelected }) => {
        const {
            content,
            tagName,
            animationType,
            speed,
            stagger,
            splitType,
            threshold,
            trigger,
            direction,
            easing,
            reverseOrder,
            useOutline,
            outlineWidth,
            perspective,
            customFontSize,
            customFontSizeMobile,
            customLineHeight,
            customLineHeightMobile,
            fontSize,
            style,
            
        } = attributes;

        const hasNativeTypo = !!(fontSize || style?.typography?.fontSize || style?.typography?.lineHeight);
        const hasCustomTypo = !!(customFontSize || customFontSizeMobile || customLineHeight || customLineHeightMobile);

        const freeAnimationTypes = ['reveal', 'blur', 'pop'];
        let editorAnimationType = freeAnimationTypes.includes(animationType) ? animationType : 'reveal';
        let editorTrigger = 'scroll';
        let editorShowsDirectionControl = true;
        let editorSupportsTriggerControl = true;

        

        const resetCustomFont = () => {
            const resetAttributes = {
                customFontSize: undefined,
                customFontSizeMobile: undefined,
                customLineHeight: undefined,
                customLineHeightMobile: undefined
            };

            

            setAttributes(resetAttributes);
        };

        const cssVars = {
            '--kh-ty-outline-w': `${outlineWidth}px`
        };

        

        if (hasCustomTypo) {
            if (customFontSize) cssVars['--kh-ty-fs-desk'] = `${customFontSize}px`;
            if (customFontSizeMobile) cssVars['--kh-ty-fs-mob'] = `${customFontSizeMobile}px`;
            if (customLineHeight) cssVars['--kh-ty-lh-desk'] = customLineHeight;
            if (customLineHeightMobile) cssVars['--kh-ty-lh-mob'] = customLineHeightMobile;
        }

        /*
         * Custom typography owns one PROPERTY at one BREAKPOINT, never both of
         * either. The aggregate class used to carry the CSS for font-size and
         * line-height together, so a custom size alone also declared
         * line-height against a custom property that was never set -- invalid
         * at computed-value time, resolved to unset, and the theme's
         * line-height was lost to a control nobody touched. A flag per
         * property per breakpoint keeps each declaration out of the stylesheet
         * until its value exists.
         *
         * The native marker is INDEPENDENT of the custom one. WordPress
         * typography lands on the wrapper, and `.kh-ty-text-content` is an
         * h1/h2/... carrying its own theme typography, so the native rule is
         * what forwards a native value to the inner element at all. Emitting
         * it only when no custom control was touched meant one custom
         * property silently dropped the native value on the OTHER property.
         * Both markers are emitted on their own condition; the stylesheet
         * orders the native baseline before the custom overrides.
         *
         * Must stay identical to the class list render.php builds, or the
         * editor and the frontend disagree about who owns the property.
         */
        const classes = [
            'kh-ty-editor-preview',
            'kh-ty-master-typography',
            hasNativeTypo ? 'kh-ty-has-native-typo' : '',
            hasCustomTypo ? 'kh-ty-has-custom-typo' : '',
            customFontSize ? 'kh-ty-has-custom-font-size' : '',
            customFontSizeMobile ? 'kh-ty-has-custom-font-size-mobile' : '',
            customLineHeight ? 'kh-ty-has-custom-line-height' : '',
            customLineHeightMobile ? 'kh-ty-has-custom-line-height-mobile' : '',
            `kh-ty-anim-${editorAnimationType}`,
            useOutline ? 'kh-ty-has-outline' : '',
            
        ].filter(Boolean).join(' ');

        const blockProps = useBlockProps({ className: classes, style: cssVars });

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('⚙️ Animation Main Settings', 'kinetichub')} initialOpen={true}>
                        <SelectControl
                            label={labelWithHelp(__('Animation Style', 'kinetichub'), __('Reveal slides each piece out from behind a mask, Blur In brings it in out of focus, and Pop In scales it up. Whether a piece is a letter or a whole word is set by Split Strategy, under Content & Mechanics.', 'kinetichub'))}
                            value={editorAnimationType}
                            options={[
                                { label: __('Reveal (Masked)', 'kinetichub'), value: 'reveal' },
                                { label: __('Blur In', 'kinetichub'), value: 'blur' },
                                { label: __('Pop In', 'kinetichub'), value: 'pop' },
                                
                            ]}
                            onChange={(value) => setAttributes({ animationType: value })}
                        />

                        
                        {/* Directly under the style list, which is the one place
                          * an author asks what else this control could be. */}
                        <ProNote
                            text={__('Seven more animation styles: Bounce Drop, 3D Flip, Skew Shift, Matrix Scramble, Cyber Node Focus, a Continuous Pulse that keeps breathing after it arrives, and a Plexus Network that draws a canvas of connected nodes over the letters.', 'kinetichub')}
                        />
                        

                        {editorShowsDirectionControl && (
                            <SelectControl
                                label={labelWithHelp(__('Movement Direction', 'kinetichub'), __('Which way each piece travels as it arrives.', 'kinetichub'))}
                                value={direction}
                                options={[
                                    { label: __('Move Upwards', 'kinetichub'), value: 'up' },
                                    { label: __('Move Downwards', 'kinetichub'), value: 'down' },
                                    { label: __('From Left', 'kinetichub'), value: 'left' },
                                    { label: __('From Right', 'kinetichub'), value: 'right' }
                                ]}
                                onChange={(value) => setAttributes({ direction: value })}
                            />
                        )}

                        <RangeControl
                            label={labelWithHelp(__('Duration / Speed (s)', 'kinetichub'), __('How long one piece takes to finish, in seconds. This is per piece — the whole line takes longer, because each piece starts after the last by the stagger delay.', 'kinetichub'))}
                            value={speed}
                            onChange={(value) => setAttributes({ speed: value })}
                            min={0.1}
                            max={3}
                            step={0.1}
                        />

                        <RangeControl
                            label={labelWithHelp(__('Stagger Delay (s)', 'kinetichub'), __('Seconds between one piece starting and the next. At 0 the whole line moves as one; on long text a large value can take many seconds to finish.', 'kinetichub'))}
                            value={stagger}
                            onChange={(value) => setAttributes({ stagger: value })}
                            min={0}
                            max={0.5}
                            step={0.01}
                        />

                        <SelectControl
                            label={labelWithHelp(__('Easing Mode', 'kinetichub'), __('The acceleration curve. Smooth eases in and out, Bouncy overshoots and settles back, Snappy starts fast and decelerates hard.', 'kinetichub'))}
                            value={easing}
                            options={[
                                { label: __('Smooth (Default)', 'kinetichub'), value: 'smooth' },
                                { label: __('Bouncy', 'kinetichub'), value: 'bouncy' },
                                { label: __('Snappy', 'kinetichub'), value: 'snappy' }
                            ]}
                            onChange={(value) => setAttributes({ easing: value })}
                        />

                        {editorSupportsTriggerControl && (
                            <SelectControl
                                label={labelWithHelp(__('Activation Trigger', 'kinetichub'), __('When the animation runs. On Scroll plays it once the block reaches the Viewport Trigger Point below.', 'kinetichub'))}
                                value={editorTrigger}
                                options={[
                                    { label: __('On Scroll (Entrance)', 'kinetichub'), value: 'scroll' },
                                    
                                ]}
                                onChange={(value) => setAttributes({ trigger: value })}
                            />
                        )}

                        {editorTrigger === 'scroll' && (
                            <>
                                <RangeControl
                                    label={labelWithHelp(__('Viewport Trigger Point', 'kinetichub'), __('How much of the block must be on screen before it starts. 0.2 = starts when 20% visible. 0.8 = starts when almost fully visible.', 'kinetichub'))}
                                    value={threshold}
                                    onChange={(value) => setAttributes({ threshold: value })}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                />

                                
                            </>
                        )}

                        

                        
                        {/* The end of the trigger group, where the hover and
                          * replay controls sit in PRO. Timing behaviour that
                          * lives in Content & Mechanics is named here too --
                          * it answers the same question about when and how
                          * often the text moves. */}
                        <ProNote
                            text={__('Start on hover instead of on scroll, replay when the cursor leaves, and repeat every time the text scrolls back into view — plus randomised per-letter timing and an infinite loop.', 'kinetichub')}
                        />
                        
                    </PanelBody>

                    

                    

                    <PanelBody title={__('📱 Responsive Typography', 'kinetichub')} initialOpen={false}>
                        <div className="kh-ty-custom-font-control">
                            <BaseControl help={__('Use the reset button below to revert to native theme sizes.', 'kinetichub')}>
                                <RangeControl label={__('Desktop Font Size (px)', 'kinetichub')} value={customFontSize || 0} onChange={(value) => setAttributes({ customFontSize: value })} min={12} max={200} />
                                <RangeControl label={__('Mobile Font Size (px)', 'kinetichub')} value={customFontSizeMobile || 0} onChange={(value) => setAttributes({ customFontSizeMobile: value })} min={12} max={100} />
                                <RangeControl label={__('Desktop Line Height', 'kinetichub')} value={customLineHeight || 0} onChange={(value) => setAttributes({ customLineHeight: value })} min={0.8} max={3} step={0.1} />
                                <RangeControl label={__('Mobile Line Height', 'kinetichub')} value={customLineHeightMobile || 0} onChange={(value) => setAttributes({ customLineHeightMobile: value })} min={0.8} max={3} step={0.1} />

                                

                                {(hasCustomTypo
                                    
                                ) && (
                                    <Button variant="link" className="is-destructive" onClick={resetCustomFont}>
                                        {__('Reset responsive sizes', 'kinetichub')}
                                    </Button>
                                )}
                            </BaseControl>
                        </div>
                    </PanelBody>

                    <PanelBody title={__('🎨 Visual Styles', 'kinetichub')} initialOpen={false}>
                        
                        {/* The exact seat of the blend, gradient and glow
                          * controls PRO opens this panel with. */}
                        <ProNote
                            text={__('Text gradients at any angle, a neon glow in a colour you pick, optical blend modes that let the text react to whatever sits behind it, an adjustable 3D perspective for the 3D styles, and a mobile-only alignment override.', 'kinetichub')}
                        />
                        
                        

                        <ToggleControl label={labelWithHelp(__('Enable Outline Mode', 'kinetichub'), __('Draws the letters as an outline with a transparent fill, using the current text colour.', 'kinetichub'))} checked={useOutline} onChange={(value) => setAttributes({ useOutline: value })} />

                        {useOutline && (
                            <RangeControl label={__('Stroke Width (px)', 'kinetichub')} value={outlineWidth} onChange={(value) => setAttributes({ outlineWidth: value })} min={1} max={10} />
                        )}

                        

                        
                        {/* Last thing in the last styling panel, and the seat of
                          * the 3D perspective control. The Visual Addons panel
                          * PRO adds sits just above this one, so this is the
                          * nearest place FREE can learn it exists. */}
                        <ProNote
                            text={__('A Visual Addons panel as well: a highlight sweep drawn behind the text once it lands, an aurora backlight glowing behind the block, infinite levitation, a hover glitch, and a mirrored floor reflection.', 'kinetichub')}
                        />
                        
                    </PanelBody>

                    <PanelBody title={__('⚙️ Content & Mechanics', 'kinetichub')} initialOpen={false}>
                        <SelectControl
                            label={labelWithHelp(__('Split Strategy', 'kinetichub'), __('Whether each letter or each whole word animates as one piece. Characters give a finer effect but create far more elements — text longer than 500 characters is split by word regardless.', 'kinetichub'))}
                            value={splitType}
                            options={[
                                { label: __('Characters', 'kinetichub'), value: 'chars' },
                                { label: __('Words', 'kinetichub'), value: 'words' }
                            ]}
                            onChange={(value) => setAttributes({ splitType: value })}
                        />

                        {/*
                          * Was a second canvas toast, which was the wrong mechanism
                          * twice over: it announced itself into the same role="status"
                          * region as the frontend-only notice beside it, and it hid
                          * itself on the next click even though the condition it
                          * describes is still true afterwards.
                          *
                          * It is a fault in the current configuration, so it is a
                          * Notice, and it belongs against the control that causes it.
                          * The trigger is unchanged; isSelected is redundant inside
                          * InspectorControls, which only mount for the selected
                          * block, and is kept so the condition stays verbatim.
                          */}
                        {isSelected && content && content.length > 500 && splitType === 'chars' && (
                            <InspectorNotice>
                                {__('Text is long. The frontend renderer may use word-based splitting for better performance.', 'kinetichub')}
                            </InspectorNotice>
                        )}

                        <SelectControl
                            label={__('HTML Heading Tag', 'kinetichub')}
                            value={tagName}
                            options={[
                                { label: 'H1', value: 'h1' },
                                { label: 'H2', value: 'h2' },
                                { label: 'H3', value: 'h3' },
                                { label: 'H4', value: 'h4' },
                                { label: __('Paragraph', 'kinetichub'), value: 'p' },
                                { label: 'Div', value: 'div' }
                            ]}
                            onChange={(value) => setAttributes({ tagName: value })}
                        />

                        {['h1', 'h2', 'h3'].includes(tagName) && (
                            <InspectorNotice>
                                {__('For SEO-critical headings, avoid per-letter animation. Use this effect for hero or decorative text.', 'kinetichub')}
                            </InspectorNotice>
                        )}

                        <ToggleControl label={labelWithHelp(__('Reverse Animation Order', 'kinetichub'), __('Starts the stagger from the last piece and works backwards.', 'kinetichub'))} checked={reverseOrder} onChange={(value) => setAttributes({ reverseOrder: value })} />

                        
                    </PanelBody>

                    
                </InspectorControls>

                <div {...blockProps}>
                    {!content && (
                        <div className="kh-ty-empty-placeholder">
                            <strong>{__('Kinetic Typography Block', 'kinetichub')}</strong><br/>
                            <small>{__('Enter text below to start.', 'kinetichub')}</small>
                        </div>
                    )}

                    <div className="kh-ty-text-wrapper">
                        

                        <RichText
                            tagName={tagName}
                            value={content}
                            onChange={(value) => setAttributes({ content: value })}
                            placeholder={__('Type your animated headline...', 'kinetichub')}
                            className="kh-ty-text-content"
                            allowedFormats={[]}
                        />
                    </div>

                    {/*
                      * .kh-ty-editor-notice-wrap used to be here and held nothing but
                      * the absolutely positioned toast, so it had no height of its own
                      * and the toast was measuring bottom: 12px from a zero-height
                      * line.
                      *
                      * .kh-ty-master-typography is position: relative and would be a
                      * valid owner, but a headline is frequently a single line and the
                      * toast would then sit on the text being edited. A lane below the
                      * text is the smallest thing that is both a real containing block
                      * and out of the way.
                      *
                      * Editor only: render.php emits no such element, which is also
                      * why the old class could be dropped from style.scss outright.
                      */}
                    {isSelected && (
                        <div style={{ position: 'relative', width: '100%', minHeight: '52px', marginTop: '15px', zIndex: 99 }}>
                            <KineticEditorNotice message={__('Text animations and generative effects run on the live frontend.', 'kinetichub')} />
                        </div>
                    )}
                </div>
            </>
        );
    },

    save: () => null
});