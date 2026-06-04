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

/* <fs_premium_only> */
import { KineticVisibilityControls } from '../../components/VisibilityControls';
/* </fs_premium_only> */
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
            /* <fs_premium_only> */
            randomize,
            iterations,
            pulseIntensity,
            pulseMinOpacity,
            pulseMode,
            useGradient,
            gradColor1,
            gradColor2,
            gradAngle,
            useGlow,
            glowColor,
            blendMode,
            resetOnLeave,
            triggerAlways,
            hoverGlitch,
            floorReflection,
            reflectionDistance,
            reflectionOpacity,
            auroraBacklight,
            auroraColor,
            auroraSpread,
            infiniteLevitation,
            highlightSweep,
            highlightColor,
            plexusDensity,
            plexusSpeed,
            plexusNodeSize,
            plexusLineDistance,
            plexusNodeColor,
            plexusLineColor,
            plexusOpacity,
            plexusContinuous,
            plexusSpread,
            plexusInteraction,
            textAlignMobile
            /* </fs_premium_only> */
        } = attributes;

        const hasNativeTypo = !!(fontSize || style?.typography?.fontSize || style?.typography?.lineHeight);
        const hasCustomTypo = !!(customFontSize || customFontSizeMobile || customLineHeight || customLineHeightMobile);

        const freeAnimationTypes = ['reveal', 'blur', 'pop'];
        let editorAnimationType = freeAnimationTypes.includes(animationType) ? animationType : 'reveal';
        let editorTrigger = 'scroll';
        let editorShowsDirectionControl = true;
        let editorSupportsTriggerControl = true;

        /* <fs_premium_only> */
        editorAnimationType = animationType || 'reveal';
        editorTrigger = trigger || 'scroll';
        editorShowsDirectionControl = !['plexus', 'pulse', 'scramble', 'cyber'].includes(editorAnimationType);
        editorSupportsTriggerControl = editorAnimationType !== 'plexus';
        /* </fs_premium_only> */

        const resetCustomFont = () => {
            const resetAttributes = {
                customFontSize: undefined,
                customFontSizeMobile: undefined,
                customLineHeight: undefined,
                customLineHeightMobile: undefined
            };

            /* <fs_premium_only> */
            resetAttributes.textAlignMobile = undefined;
            /* </fs_premium_only> */

            setAttributes(resetAttributes);
        };

        const cssVars = {
            '--kh-ty-outline-w': `${outlineWidth}px`
        };

        /* <fs_premium_only> */
        cssVars['--kh-ty-blend'] = blendMode || 'normal';
        cssVars['--kh-ty-pulse-intensity'] = pulseIntensity ?? 0.06;
        cssVars['--kh-ty-pulse-min-opacity'] = pulseMinOpacity ?? 0.88;

        if (floorReflection) {
            cssVars['--kh-ty-reflect-dist'] = `${reflectionDistance}px`;
            cssVars['--kh-ty-reflect-op'] = reflectionOpacity;
        }

        if (auroraBacklight) {
            cssVars['--kh-ty-aurora-c'] = auroraColor;
            cssVars['--kh-ty-aurora-s'] = `${auroraSpread}px`;
        }

        if (highlightSweep) {
            cssVars['--kh-ty-highlight-c'] = highlightColor;
        }

        if (useGradient) {
            cssVars['--kh-ty-grad-1'] = gradColor1 || 'var(--kh-accent, #007bff)';
            cssVars['--kh-ty-grad-2'] = gradColor2;
            cssVars['--kh-ty-grad-angle'] = `${gradAngle}deg`;
        }

        if (useGlow) {
            cssVars['--kh-ty-glow-color'] = glowColor || 'rgba(0, 255, 240, 0.6)';
        }
        /* </fs_premium_only> */

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
            /* <fs_premium_only> */
            hoverGlitch ? 'has-hover-glitch' : '',
            floorReflection ? 'has-floor-reflect' : '',
            auroraBacklight ? 'has-aurora-backlight' : '',
            infiniteLevitation ? 'has-levitation' : '',
            highlightSweep ? 'has-highlight-sweep' : '',
            useGradient ? 'kh-ty-has-gradient' : '',
            useGlow ? 'kh-ty-has-glow' : '',
            editorAnimationType === 'pulse' ? `kh-ty-pulse-mode-${pulseMode || 'soft'}` : '',
            textAlignMobile ? `kh-ty-align-mob-${textAlignMobile}` : ''
            /* </fs_premium_only> */
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
                                /* <fs_premium_only> */
                                { label: __('Bounce Drop', 'kinetichub'), value: 'bounce' },
                                { label: __('3D Flip', 'kinetichub'), value: 'flip' },
                                { label: __('Skew Shift', 'kinetichub'), value: 'skew' },
                                { label: __('Matrix Scramble', 'kinetichub'), value: 'scramble' },
                                { label: __('Plexus Network (Canvas)', 'kinetichub'), value: 'plexus' },
                                { label: __('Continuous Pulse', 'kinetichub'), value: 'pulse' },
                                { label: __('Cyber Node Focus', 'kinetichub'), value: 'cyber' }
                                /* </fs_premium_only> */
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
                                    /* <fs_premium_only> */
                                    { label: __('On Mouse Hover', 'kinetichub'), value: 'hover' }
                                    /* </fs_premium_only> */
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

                                {/* <fs_premium_only> */}
                                {!(editorAnimationType === 'plexus' && plexusContinuous) && (
                                    <ToggleControl
                                        label={__('Repeat on Scroll', 'kinetichub')}
                                        help={__('If enabled, the animation will replay every time you scroll back to this element.', 'kinetichub')}
                                        checked={triggerAlways}
                                        onChange={(value) => setAttributes({ triggerAlways: value })}
                                    />
                                )}
                                {/* </fs_premium_only> */}
                            </>
                        )}

                        {/* <fs_premium_only> */}
                        {editorTrigger === 'hover' && !(editorAnimationType === 'plexus' && plexusContinuous) && (
                            <ToggleControl
                                label={__('Replay on Mouse Leave', 'kinetichub')}
                                checked={resetOnLeave}
                                onChange={(value) => setAttributes({ resetOnLeave: value })}
                                help={__('Resets the animation state when the cursor leaves the text.', 'kinetichub')}
                            />
                        )}
                        {/* </fs_premium_only> */}
                    </PanelBody>

                    {/* <fs_premium_only> */}
                    {editorAnimationType !== 'plexus' && (
                        <PanelBody title={__('✨ Visual Addons', 'kinetichub')} initialOpen={false}>
                            <ToggleControl
                                label={__('Cinematic Highlight Sweep', 'kinetichub')}
                                checked={highlightSweep}
                                onChange={(value) => setAttributes({ highlightSweep: value })}
                                help={__('Draws a marker-style highlight behind the text after the entrance animation finishes.', 'kinetichub')}
                            />

                            {highlightSweep && (
                                <div className="kh-ty-control-box">
                                    <p>{__('Highlight Color', 'kinetichub')}</p>
                                    <ColorPalette value={highlightColor} onChange={(value) => setAttributes({ highlightColor: value })} enableAlpha={true} />
                                </div>
                            )}

                            <Divider />

                            <ToggleControl
                                label={__('Aurora Ambient Backlight', 'kinetichub')}
                                checked={auroraBacklight}
                                onChange={(value) => setAttributes({ auroraBacklight: value })}
                                help={__('Generates a soft, blurred aura behind the typography block.', 'kinetichub')}
                            />

                            {auroraBacklight && (
                                <div className="kh-ty-control-box">
                                    <p>{__('Aura Color', 'kinetichub')}</p>
                                    <ColorPalette value={auroraColor} onChange={(value) => setAttributes({ auroraColor: value })} enableAlpha={true} />
                                    <RangeControl
                                        label={__('Aura Spread (Blur)', 'kinetichub')}
                                        value={auroraSpread}
                                        onChange={(value) => setAttributes({ auroraSpread: value })}
                                        min={10}
                                        max={150}
                                    />
                                </div>
                            )}

                            <Divider />

                            <ToggleControl
                                label={__('Infinite Levitation', 'kinetichub')}
                                checked={infiniteLevitation}
                                onChange={(value) => setAttributes({ infiniteLevitation: value })}
                                help={__('Causes the typography block to float smoothly on the Y axis.', 'kinetichub')}
                            />

                            <Divider />

                            <ToggleControl
                                label={__('Cyberpunk Hover Glitch', 'kinetichub')}
                                checked={hoverGlitch}
                                onChange={(value) => setAttributes({ hoverGlitch: value })}
                                help={__('Applies a subtle RGB distortion when the user hovers over the text.', 'kinetichub')}
                            />

                            <Divider />

                            <ToggleControl
                                label={__('Cinematic Floor Reflection', 'kinetichub')}
                                checked={floorReflection}
                                onChange={(value) => setAttributes({ floorReflection: value })}
                                help={__('Generates a faded reflection beneath the typography.', 'kinetichub')}
                            />

                            {floorReflection && (
                                <div className="kh-ty-control-box">
                                    <RangeControl
                                        label={__('Distance from Text (px)', 'kinetichub')}
                                        value={reflectionDistance}
                                        onChange={(value) => setAttributes({ reflectionDistance: value })}
                                        min={-50}
                                        max={50}
                                    />
                                    <RangeControl
                                        label={__('Reflection Opacity', 'kinetichub')}
                                        value={reflectionOpacity}
                                        onChange={(value) => setAttributes({ reflectionOpacity: value })}
                                        min={0.1}
                                        max={1}
                                        step={0.1}
                                    />
                                </div>
                            )}
                        </PanelBody>
                    )}
                    {/* </fs_premium_only> */}

                    {/* <fs_free_only> */}
                    <PanelBody title={__('Additional Visual Effects', 'kinetichub')} initialOpen={false}>
                        <p className="kh-ty-static-note">
                            {__('Additional visual effects are available in the separate premium version.', 'kinetichub')}
                        </p>
                    </PanelBody>
                    {/* </fs_free_only> */}

                    {/* <fs_premium_only> */}
                    {editorAnimationType === 'plexus' && (
                        <PanelBody title={__('🌌 Plexus Settings', 'kinetichub')} initialOpen={false}>
                            <RangeControl label={__('Node Density', 'kinetichub')} value={plexusDensity} onChange={(value) => setAttributes({ plexusDensity: value })} min={10} max={100} step={1} />
                            <RangeControl label={__('Movement Speed', 'kinetichub')} value={plexusSpeed} onChange={(value) => setAttributes({ plexusSpeed: value })} min={0.1} max={1} step={0.1} />
                            <RangeControl label={__('Network Opacity', 'kinetichub')} value={plexusOpacity} onChange={(value) => setAttributes({ plexusOpacity: value })} min={0.1} max={1} step={0.1} />
                            <Divider />
                            <RangeControl label={__('Node Thickness', 'kinetichub')} value={plexusNodeSize} onChange={(value) => setAttributes({ plexusNodeSize: value })} min={0.5} max={10} step={0.5} />
                            <RangeControl label={__('Line Connection Distance', 'kinetichub')} value={plexusLineDistance} onChange={(value) => setAttributes({ plexusLineDistance: value })} min={10} max={100} step={1} />
                            <SelectControl
                                label={__('Cursor Interaction', 'kinetichub')}
                                value={plexusInteraction}
                                options={[
                                    { label: __('None', 'kinetichub'), value: 'none' },
                                    { label: __('Repel Particles', 'kinetichub'), value: 'repel' },
                                    { label: __('Attract Particles', 'kinetichub'), value: 'attract' }
                                ]}
                                onChange={(value) => setAttributes({ plexusInteraction: value })}
                            />
                            <SelectControl
                                label={__('Particle Spread', 'kinetichub')}
                                value={plexusSpread}
                                options={[
                                    { label: __('Strict Inside Letters', 'kinetichub'), value: 'inside' },
                                    { label: __('Free Float Around Text', 'kinetichub'), value: 'around' }
                                ]}
                                onChange={(value) => setAttributes({ plexusSpread: value })}
                            />
                            <ToggleControl label={__('Continuous Motion', 'kinetichub')} checked={plexusContinuous} onChange={(value) => setAttributes({ plexusContinuous: value })} />
                            <Divider />
                            <p>{__('Nodes Color', 'kinetichub')}</p>
                            <ColorPalette value={plexusNodeColor} onChange={(value) => setAttributes({ plexusNodeColor: value })} enableAlpha={true} />
                            <p>{__('Connecting Lines Color', 'kinetichub')}</p>
                            <ColorPalette value={plexusLineColor} onChange={(value) => setAttributes({ plexusLineColor: value })} enableAlpha={true} />
                        </PanelBody>
                    )}

                    {editorAnimationType === 'pulse' && (
                        <PanelBody title={__('💓 Pulse Settings', 'kinetichub')} initialOpen={false}>
                            <RangeControl label={__('Pulse Intensity', 'kinetichub')} value={pulseIntensity} onChange={(value) => setAttributes({ pulseIntensity: value })} min={0.01} max={0.2} step={0.01} />
                            <RangeControl label={__('Pulse Minimum Opacity', 'kinetichub')} value={pulseMinOpacity} onChange={(value) => setAttributes({ pulseMinOpacity: value })} min={0.3} max={1} step={0.01} />
                            <SelectControl
                                label={__('Pulse Mode', 'kinetichub')}
                                value={pulseMode}
                                options={[
                                    { label: __('Soft', 'kinetichub'), value: 'soft' },
                                    { label: __('Balanced', 'kinetichub'), value: 'balanced' },
                                    { label: __('Deep', 'kinetichub'), value: 'deep' }
                                ]}
                                onChange={(value) => setAttributes({ pulseMode: value })}
                            />
                        </PanelBody>
                    )}
                    {/* </fs_premium_only> */}

                    <PanelBody title={__('📱 Responsive Typography', 'kinetichub')} initialOpen={false}>
                        <div className="kh-ty-custom-font-control">
                            <BaseControl help={__('Use the reset button below to revert to native theme sizes.', 'kinetichub')}>
                                <RangeControl label={__('Desktop Font Size (px)', 'kinetichub')} value={customFontSize || 0} onChange={(value) => setAttributes({ customFontSize: value })} min={12} max={200} />
                                <RangeControl label={__('Mobile Font Size (px)', 'kinetichub')} value={customFontSizeMobile || 0} onChange={(value) => setAttributes({ customFontSizeMobile: value })} min={12} max={100} />
                                <RangeControl label={__('Desktop Line Height', 'kinetichub')} value={customLineHeight || 0} onChange={(value) => setAttributes({ customLineHeight: value })} min={0.8} max={3} step={0.1} />
                                <RangeControl label={__('Mobile Line Height', 'kinetichub')} value={customLineHeightMobile || 0} onChange={(value) => setAttributes({ customLineHeightMobile: value })} min={0.8} max={3} step={0.1} />

                                {/* <fs_premium_only> */}
                                <SelectControl
                                    label={__('Mobile Alignment Override', 'kinetichub')}
                                    value={textAlignMobile}
                                    options={[
                                        { label: __('Inherit', 'kinetichub'), value: '' },
                                        { label: __('Left', 'kinetichub'), value: 'left' },
                                        { label: __('Center', 'kinetichub'), value: 'center' },
                                        { label: __('Right', 'kinetichub'), value: 'right' }
                                    ]}
                                    onChange={(value) => setAttributes({ textAlignMobile: value })}
                                />
                                {/* </fs_premium_only> */}

                                {(hasCustomTypo
                                    /* <fs_premium_only> */
                                    || textAlignMobile
                                    /* </fs_premium_only> */
                                ) && (
                                    <Button variant="link" className="is-destructive" onClick={resetCustomFont}>
                                        {__('Reset responsive sizes', 'kinetichub')}
                                    </Button>
                                )}
                            </BaseControl>
                        </div>
                    </PanelBody>

                    <PanelBody title={__('🎨 Visual Styles', 'kinetichub')} initialOpen={false}>
                        {/* <fs_premium_only> */}
                        <SelectControl
                            label={__('Optical Blend Mode', 'kinetichub')}
                            value={blendMode}
                            options={[
                                { label: __('Normal', 'kinetichub'), value: 'normal' },
                                { label: __('Difference', 'kinetichub'), value: 'difference' },
                                { label: __('Exclusion', 'kinetichub'), value: 'exclusion' },
                                { label: __('Overlay', 'kinetichub'), value: 'overlay' }
                            ]}
                            onChange={(value) => setAttributes({ blendMode: value })}
                        />
                        <Divider />
                        <ToggleControl label={__('Enable Text Gradient', 'kinetichub')} checked={useGradient} onChange={(value) => setAttributes({ useGradient: value })} />
                        {useGradient && (
                            <>
                                <p>{__('Start Color', 'kinetichub')}</p>
                                <ColorPalette value={gradColor1} onChange={(value) => setAttributes({ gradColor1: value })} enableAlpha={true} />
                                <p>{__('End Color', 'kinetichub')}</p>
                                <ColorPalette value={gradColor2} onChange={(value) => setAttributes({ gradColor2: value })} enableAlpha={true} />
                                <RangeControl label={__('Gradient Angle', 'kinetichub')} value={gradAngle} onChange={(value) => setAttributes({ gradAngle: value })} min={0} max={360} />
                            </>
                        )}
                        <Divider />
                        <ToggleControl label={__('Enable Neon Glow', 'kinetichub')} checked={useGlow} onChange={(value) => setAttributes({ useGlow: value })} />
                        {useGlow && (
                            <>
                                <p>{__('Glow Color', 'kinetichub')}</p>
                                <ColorPalette value={glowColor} onChange={(value) => setAttributes({ glowColor: value })} enableAlpha={true} />
                            </>
                        )}
                        <Divider />
                        {/* </fs_premium_only> */}

                        <ToggleControl label={__('Enable Outline Mode', 'kinetichub')} checked={useOutline} onChange={(value) => setAttributes({ useOutline: value })} />

                        {useOutline && (
                            <RangeControl label={__('Stroke Width (px)', 'kinetichub')} value={outlineWidth} onChange={(value) => setAttributes({ outlineWidth: value })} min={1} max={10} />
                        )}

                        {/* <fs_premium_only> */}
                        <RangeControl
                            label={__('3D Perspective', 'kinetichub')}
                            value={perspective}
                            onChange={(value) => setAttributes({ perspective: value })}
                            min={500}
                            max={3000}
                            step={100}
                            help={__('Used by 3D animation styles in the premium version.', 'kinetichub')}
                        />
                        {/* </fs_premium_only> */}
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

                        {/* <fs_premium_only> */}
                        <ToggleControl label={__('Randomize Timing', 'kinetichub')} checked={randomize} onChange={(value) => setAttributes({ randomize: value })} />

                        {!(editorAnimationType === 'plexus' && plexusContinuous) && !resetOnLeave && !triggerAlways && (
                            <SelectControl
                                label={__('Loop Animation', 'kinetichub')}
                                value={iterations}
                                options={[
                                    { label: __('Play Once', 'kinetichub'), value: '1' },
                                    { label: __('Loop Infinite', 'kinetichub'), value: 'infinite' }
                                ]}
                                onChange={(value) => setAttributes({ iterations: value })}
                                help={editorAnimationType === 'pulse' ? __('Set to Loop Infinite for continuous pulse motion.', 'kinetichub') : undefined}
                            />
                        )}
                        {/* </fs_premium_only> */}
                    </PanelBody>

                    {/* <fs_premium_only> */}
                    <KineticVisibilityControls attributes={attributes} setAttributes={setAttributes} />
                    {/* </fs_premium_only> */}
                </InspectorControls>

                <div {...blockProps}>
                    {!content && (
                        <div className="kh-ty-empty-placeholder">
                            <strong>{__('Kinetic Typography Block', 'kinetichub')}</strong><br/>
                            <small>{__('Enter text below to start.', 'kinetichub')}</small>
                        </div>
                    )}

                    <div className="kh-ty-text-wrapper">
                        {/* <fs_premium_only> */}
                        {auroraBacklight && <div className="kh-ty-aurora-glow" aria-hidden="true"></div>}
                        {/* </fs_premium_only> */}

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