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
             = attributes;

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

        const classes = [
            'kh-ty-editor-preview',
            'kh-ty-master-typography',
            hasCustomTypo ? 'kh-ty-has-custom-typo' : (hasNativeTypo ? 'kh-ty-has-native-typo' : ''),
            `kh-ty-anim-${editorAnimationType}`,
            useOutline ? 'kh-ty-has-outline' : '',

        ].filter(Boolean).join(' ');

        const blockProps = useBlockProps({ className: classes, style: cssVars });

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('⚙️ Animation Main Settings', 'kinetichub')} initialOpen={true}>
                        <SelectControl
                            label={__('Animation Style', 'kinetichub')}
                            value={editorAnimationType}
                            options={[
                                { label: __('Reveal (Masked)', 'kinetichub'), value: 'reveal' },
                                { label: __('Blur In', 'kinetichub'), value: 'blur' },
                                { label: __('Pop In', 'kinetichub'), value: 'pop' },

                            ]}
                            onChange={(value) => setAttributes({ animationType: value })}
                        />

                        {editorShowsDirectionControl && (
                            <SelectControl
                                label={__('Movement Direction', 'kinetichub')}
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
                            label={__('Duration / Speed (s)', 'kinetichub')}
                            value={speed}
                            onChange={(value) => setAttributes({ speed: value })}
                            min={0.1}
                            max={3}
                            step={0.1}
                        />

                        <RangeControl
                            label={__('Stagger Delay (s)', 'kinetichub')}
                            value={stagger}
                            onChange={(value) => setAttributes({ stagger: value })}
                            min={0}
                            max={0.5}
                            step={0.01}
                            help={__('Time delay between each letter/word appearing.', 'kinetichub')}
                        />

                        <SelectControl
                            label={__('Easing Mode', 'kinetichub')}
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
                                label={__('Activation Trigger', 'kinetichub')}
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
                                    label={__('Viewport Trigger Point', 'kinetichub')}
                                    help={__('0.2 = starts when 20% visible. 0.8 = starts when almost fully visible.', 'kinetichub')}
                                    value={threshold}
                                    onChange={(value) => setAttributes({ threshold: value })}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                />


                            </>
                        )}


                    </PanelBody>




                    <PanelBody title={__('Additional Visual Effects', 'kinetichub')} initialOpen={false}>
                        <p className="kh-ty-static-note">
                            {__('Additional visual effects are available in the separate advanced version.', 'kinetichub')}
                        </p>
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


                        <ToggleControl label={__('Enable Outline Mode', 'kinetichub')} checked={useOutline} onChange={(value) => setAttributes({ useOutline: value })} />

                        {useOutline && (
                            <RangeControl label={__('Stroke Width (px)', 'kinetichub')} value={outlineWidth} onChange={(value) => setAttributes({ outlineWidth: value })} min={1} max={10} />
                        )}


                    </PanelBody>

                    <PanelBody title={__('⚙️ Content & Mechanics', 'kinetichub')} initialOpen={false}>
                        <SelectControl
                            label={__('Split Strategy', 'kinetichub')}
                            value={splitType}
                            options={[
                                { label: __('Characters', 'kinetichub'), value: 'chars' },
                                { label: __('Words', 'kinetichub'), value: 'words' }
                            ]}
                            onChange={(value) => setAttributes({ splitType: value })}
                            help={__('Text splitting is rendered server-side. Animations and stagger delays are applied on the live frontend.', 'kinetichub')}
                        />

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

                        <ToggleControl label={__('Reverse Animation Order', 'kinetichub')} checked={reverseOrder} onChange={(value) => setAttributes({ reverseOrder: value })} />


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

                    {isSelected && content && content.length > 500 && splitType === 'chars' && (
                        <div className="kh-ty-editor-notice-wrap">
                            <KineticEditorNotice
                                status="warning"
                                message={__('Text is long. The frontend renderer may use word-based splitting for better performance.', 'kinetichub')}
                            />
                        </div>
                    )}

                    {isSelected && (
                        <div className="kh-ty-editor-notice-wrap">
                            <KineticEditorNotice message={__('Animations execute on the live frontend.', 'kinetichub')} />
                        </div>
                    )}
                </div>
            </>
        );
    },

    save: () => null
});