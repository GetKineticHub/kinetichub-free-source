/**
 * Kinetic Marquee - Infinite Scrolling Gallery Block
 * Version: 1.0.2
 */

import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls, MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { PanelBody, RangeControl, ToggleControl, TextControl, Button, ColorPalette, SelectControl, Notice } from '@wordpress/components';
import { useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';



import metadata from './block.json';

const KH_MQ_FREE_MAX_ITEMS = 7;

const IconUp = (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>);
const IconDown = (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>);
const IconTrash = (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);

registerBlockType(metadata.name, {
	icon: (
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M4 12C4 16.4183 7.58172 20 12 20C14.7356 20 17.1506 18.6258 18.6015 16.5M20 12C20 7.58172 16.4183 4 12 4C9.26442 4 6.84936 5.37424 5.39853 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<path d="M15 17L19 17L19 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M9 7L5 7L5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	),

	edit: (props) => {
		const { attributes, setAttributes } = props;
		const {
			images, speed, reverseDirection, pauseOnHover, hoverSlowDown, itemHeight,
			liftEffect, edgeFade, openInNewTab, showFrame, frameBg, frameRadius,
			align, showProgressRail, progressRailPosition,
			showInteractionIndicator, highlightActiveCenter, siblingBlur, siblingBlurIntensity,
			 = attributes;

		const containerRef = useRef(null);

		const updateImage = (index, key, value) => {
			const newImages = [...images];
			newImages[index][key] = value;
			setAttributes({ images: newImages });
		};

		const moveImage = (index, direction) => {
			if ((direction === -1 && index === 0) || (direction === 1 && index === images.length - 1)) return;
			const newImages = [...images];
			const temp = newImages[index];
			newImages[index] = newImages[index + direction];
			newImages[index + direction] = temp;
			setAttributes({ images: newImages });
		};

		const removeImage = (index) => setAttributes({ images: images.filter((_, i) => i !== index) });

		const handleMediaUpload = (mediaArray) => {
			const newImgs = mediaArray.map((m) => ({ url: m.url, alt: m.alt, link: '' }));
			let combined = [...images, ...newImgs];
			
			if (combined.length > KH_MQ_FREE_MAX_ITEMS) {
				combined = combined.slice(0, KH_MQ_FREE_MAX_ITEMS);
			}
			
			setAttributes({ images: combined });
		};

		let previewImages = [...images];
		if (images.length > 0) {
			while (previewImages.length < 30) {
				previewImages = [...previewImages, ...images];
			}
		}

		let dynamicDuration = speed * (previewImages.length / 5);
		if (previewImages.length === 0) dynamicDuration = speed;

		useEffect(() => {
			if (!containerRef.current || previewImages.length === 0) return;
			const groups = containerRef.current.querySelectorAll('.kh-mq-marquee-group');
			
			let durationMs = dynamicDuration * 1000;
			if (isNaN(durationMs) || durationMs <= 0) durationMs = 30000;

			const dir = reverseDirection ? 'reverse' : 'normal';

			groups.forEach(group => {
				if (group._kh_mq_anim) group._kh_mq_anim.cancel();
				group._kh_mq_anim = group.animate([
					{ transform: 'translateX(0)' },
					{ transform: 'translateX(-100%)' }
				], {
					duration: durationMs,
					iterations: Infinity,
					direction: dir
				});

				if (pauseOnHover && containerRef.current.classList.contains('is-paused-by-js')) {
					group._kh_mq_anim.pause();
				} else if (hoverSlowDown && containerRef.current.classList.contains('is-slow-by-js')) {
					group._kh_mq_anim.playbackRate = 0.3;
				}
			});

			containerRef.current.classList.add('js-anim-active');

			return () => {
				groups.forEach(group => { if (group._kh_mq_anim) group._kh_mq_anim.cancel(); });
			};
		}, [dynamicDuration, reverseDirection, previewImages.length, hoverSlowDown, pauseOnHover]);

		const handlePointerEnter = () => {
			if (!containerRef.current) return;
			const groups = containerRef.current.querySelectorAll('.kh-mq-marquee-group');
			if (pauseOnHover) {
				containerRef.current.classList.add('is-paused-by-js');
				if (containerRef.current.classList.contains('js-anim-active')) {
					groups.forEach(g => { if (g._kh_mq_anim) g._kh_mq_anim.pause(); });
				}
			} else if (hoverSlowDown) {
				containerRef.current.classList.add('is-slow-by-js');
				if (containerRef.current.classList.contains('js-anim-active')) {
					groups.forEach(g => { if (g._kh_mq_anim) g._kh_mq_anim.playbackRate = 0.3; });
				}
			}
		};

		const handlePointerLeave = () => {
			if (!containerRef.current) return;
			const groups = containerRef.current.querySelectorAll('.kh-mq-marquee-group');
			if (pauseOnHover) {
				containerRef.current.classList.remove('is-paused-by-js');
				if (containerRef.current.classList.contains('js-anim-active')) {
					groups.forEach(g => { if (g._kh_mq_anim) g._kh_mq_anim.play(); });
				}
			} else if (hoverSlowDown) {
				containerRef.current.classList.remove('is-slow-by-js');
				if (containerRef.current.classList.contains('js-anim-active')) {
					groups.forEach(g => { if (g._kh_mq_anim) g._kh_mq_anim.playbackRate = 1; });
				}
			}
		};

		let outerClassList = [
			'kh-mq-marquee-container',
			'kh-mq-editor-preview',
			align === 'full' ? 'alignfull' : '',
			pauseOnHover ? 'is-pause-hover' : '',
			hoverSlowDown ? 'is-slow-hover' : '',
			liftEffect ? 'has-lift-effect' : '',
			reverseDirection ? 'is-reversed' : '',
			showFrame ? 'has-frames' : '',
			showProgressRail ? 'has-progress-rail' : '',
			showProgressRail ? `rail-pos-${progressRailPosition}` : '',
			showInteractionIndicator ? 'has-interaction-indicator' : '',
			highlightActiveCenter ? 'has-active-center-highlight' : '',
			siblingBlur ? 'has-sibling-blur' : '',
		];
		
		const outerClasses = outerClassList.filter(Boolean).join(' ');

		const cssVars = {
			'--kh-mq-duration': `${dynamicDuration}s`,
			'--kh-mq-h': `${itemHeight}px`,
			'--kh-mq-h-mob': `${itemHeight}px`,
			'--kh-mq-gap': '50px',
			'--kh-mq-frame-bg': frameBg,
			'--kh-mq-frame-rad': `${frameRadius}px`,
			'--kh-mq-max-w': 'none',
			'--kh-mq-blur': `${siblingBlurIntensity}px`,
		};
		

		const blockProps = useBlockProps({
			ref: containerRef,
			className: outerClasses,
			style: cssVars,
			onPointerEnter: handlePointerEnter,
			onPointerLeave: handlePointerLeave,
		});

		let previewFrameShadow = 'soft';
		

		return (
			<>
				<InspectorControls>
    <PanelBody title={__('🖼️ Gallery & Links', 'kinetichub')} initialOpen={true}>

        
        <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#64748b' }}>
            {__('Free version is limited to 7 items.', 'kinetichub')}
        </p>
        

        

        <MediaUploadCheck fallback={
            <p style={{color: '#ef4444', fontSize: '12px'}}>
                {__('You do not have permission to upload media.', 'kinetichub')}
            </p>
        }>
            <MediaUpload
                multiple={true}
                onSelect={handleMediaUpload}
                allowedTypes={['image']}
                render={({ open }) => (
                    <>
                        
                        <Button
                            variant="primary"
                            onClick={open}
                            style={{ width: '100%', justifyContent: 'center', marginBottom: '15px' }}
                            disabled={images.length >= KH_MQ_FREE_MAX_ITEMS}
                        >
                            {images.length >= KH_MQ_FREE_MAX_ITEMS
                                ? __('Maximum 7 items reached', 'kinetichub')
                                : __('+ Add Images', 'kinetichub')}
                        </Button>
                        

                        
                    </>
                )}
            />
        </MediaUploadCheck>

						<ToggleControl label={__('Open links in New Tab', 'kinetichub')} checked={openInNewTab} onChange={(v) => setAttributes({ openInNewTab: v })} />

						<hr />

						{images.length > 0 && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
								{images.map((img, index) => (
									<div key={index} style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
											<div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
												<img src={img.url} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt={img.alt} />
											</div>

											<div style={{ display: 'flex', gap: '4px' }}>
												<Button isSmall style={{ padding: '0 4px' }} icon={IconUp} onClick={() => moveImage(index, -1)} disabled={index === 0} />
												<Button isSmall style={{ padding: '0 4px' }} icon={IconDown} onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} />
												<Button isSmall isDestructive style={{ padding: '0 4px' }} icon={IconTrash} onClick={() => removeImage(index)} />
											</div>
										</div>

										<TextControl label={__('Destination Link', 'kinetichub')} placeholder="https://..." value={img.link} onChange={(v) => updateImage(index, 'link', v)} __nextHasNoMarginBottom={true} />
									</div>
								))}
							</div>
						)}
					</PanelBody>

					<PanelBody title={__('⚙️ Movement & Engine', 'kinetichub')} initialOpen={false}>
						<RangeControl label={__('Base Speed (s)', 'kinetichub')} value={speed} onChange={(v) => setAttributes({ speed: v })} min={1} max={200} help={__('Lower number means faster loop duration.', 'kinetichub')} />
						<ToggleControl label={__('Reverse Direction', 'kinetichub')} checked={reverseDirection} onChange={(v) => setAttributes({ reverseDirection: v })} />
						<hr />
						<ToggleControl label={__('Pause on Hover / Tap', 'kinetichub')} checked={pauseOnHover} onChange={(v) => { setAttributes({ pauseOnHover: v }); if (v) setAttributes({ hoverSlowDown: false }); }} help={__('Completely stops the track when cursor is over it.', 'kinetichub')} />
						<ToggleControl label={__('Slow Down on Hover', 'kinetichub')} checked={hoverSlowDown} onChange={(v) => { setAttributes({ hoverSlowDown: v }); if (v) setAttributes({ pauseOnHover: false }); }} help={__('Reduces velocity to 30% for a cinematic inspection feel.', 'kinetichub')} />
					</PanelBody>

					<PanelBody title={__('🎨 Visual Styling', 'kinetichub')} initialOpen={false}>
						<RangeControl label={__('Logo Height (Desktop)', 'kinetichub')} value={itemHeight} onChange={(v) => setAttributes({ itemHeight: v })} min={30} max={300} />

						

						
						<p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', margin: '10px 0' }}>
							{__('Mobile height, max width, gap, grayscale, and idle opacity controls are not included in this build.', 'kinetichub')}
						</p>
						

						<ToggleControl label={__('Edge Fade Effect', 'kinetichub')} checked={edgeFade} onChange={(v) => setAttributes({ edgeFade: v })} />
					</PanelBody>

					<PanelBody title={__('✨ Smart Addons', 'kinetichub')} initialOpen={false}>
						<ToggleControl label={__('Hover Lift Effect', 'kinetichub')} checked={liftEffect} onChange={(v) => setAttributes({ liftEffect: v })} help={__('Elevates the hovered logo organically.', 'kinetichub')} />
						<hr />

						<ToggleControl label={__('Sibling Focus Blur', 'kinetichub')} checked={siblingBlur} onChange={(v) => setAttributes({ siblingBlur: v })} help={__('Blurs all other logos when one is hovered.', 'kinetichub')} />

						{siblingBlur && !pauseOnHover && (
							<Notice status="warning" isDismissible={false} style={{ marginBottom: '15px', marginTop: '10px' }}>
								{__('Warning: Using Sibling Blur without "Pause on Hover" makes it very difficult for users to track moving logos. Consider enabling Pause on Hover.', 'kinetichub')}
							</Notice>
						)}

						{siblingBlur && <RangeControl label={__('Blur Intensity (px)', 'kinetichub')} value={siblingBlurIntensity} onChange={(v) => setAttributes({ siblingBlurIntensity: v })} min={1} max={10} />}

						<hr />
						<ToggleControl label={__('Segmented Progress Rail', 'kinetichub')} checked={showProgressRail} onChange={(v) => setAttributes({ showProgressRail: v })} help={__('Displays a tracker based on original items.', 'kinetichub')} />

						{showProgressRail && (
							<SelectControl label={__('Rail Position', 'kinetichub')} value={progressRailPosition} options={[ { label: __('Right', 'kinetichub'), value: 'right' }, { label: __('Bottom', 'kinetichub'), value: 'bottom' } ]} onChange={(v) => setAttributes({ progressRailPosition: v })} />
						)}

						<ToggleControl label={__('Pause / Slow State Indicator', 'kinetichub')} checked={showInteractionIndicator} onChange={(v) => setAttributes({ showInteractionIndicator: v })} help={__('Shows a state badge when marquee is paused or slowed.', 'kinetichub')} />
						<ToggleControl label={__('Active Center Highlight', 'kinetichub')} checked={highlightActiveCenter} onChange={(v) => setAttributes({ highlightActiveCenter: v })} help={__('Scales and highlights the item closest to the center focus area.', 'kinetichub')} />
					</PanelBody>

					<PanelBody title={__('🖼️ Card Frames', 'kinetichub')} initialOpen={false}>
						<ToggleControl label={__('Enable Card Frame', 'kinetichub')} checked={showFrame} onChange={(v) => setAttributes({ showFrame: v })} />
						{showFrame && (
							<div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
								<p style={{ fontWeight: 'bold', marginTop: '0', marginBottom: '5px' }}>{__('Frame Background', 'kinetichub')}</p>
								<ColorPalette value={frameBg} onChange={(v) => setAttributes({ frameBg: v })} />
								<RangeControl label={__('Corner Radius', 'kinetichub')} value={frameRadius} onChange={(v) => setAttributes({ frameRadius: v })} min={0} max={50} />

								

								
								<p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', margin: '10px 0 0 0' }}>
									{__('Additional frame shadow styles (medium, hard, floating) are not included in this build.', 'kinetichub')}
								</p>
								
							</div>
						)}
					</PanelBody>

					

					
					<PanelBody title={__('📦 More Features', 'kinetichub')} initialOpen={false}>
						<p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', margin: '0' }}>
							{__('Global shadows, entrance animations, and visibility controls are not included in this build.', 'kinetichub')}
						</p>
					</PanelBody>
					
				</InspectorControls>

				<div {...blockProps}>
					{showInteractionIndicator && (
						<div className="kh-mq-interaction-indicator" data-state="running">
							<span className="kh-mq-indicator-label kh-mq-indicator-running">RUNNING</span>
							<span className="kh-mq-indicator-label kh-mq-indicator-paused">PAUSED</span>
							<span className="kh-mq-indicator-label kh-mq-indicator-slow">SLOW</span>
						</div>
					)}

					{showProgressRail && (
						<div className="kh-mq-progress-rail">
							{images.map((_, i) => (<span key={i} className={`kh-mq-progress-segment ${i === 0 ? 'is-active' : ''}`}></span>))}
						</div>
					)}

					{highlightActiveCenter && <div className="kh-mq-center-focus-zone" aria-hidden="true"></div>}

					{images.length === 0 ? (
						<div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', boxSizing: 'border-box' }}>
							<div style={{ background: '#e2e8f0', borderRadius: '50%', padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M4 12C4 16.4183 7.58172 20 12 20C14.7356 20 17.1506 18.6258 18.6015 16.5M20 12C20 7.58172 16.4183 4 12 4C9.26442 4 6.84936 5.37424 5.39853 7.5" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
									<path d="M15 17L19 17L19 21" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
									<path d="M9 7L5 7L5 3" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</div>

							<h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#0f172a' }}>{__('Kinetic Marquee', 'kinetichub')}</h3>
							<p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b', maxWidth: '400px', lineHeight: '1.5' }}>
								{__('Add images from the right sidebar or click the button below to start building your infinite scrolling gallery.', 'kinetichub')}
							</p>

							<MediaUploadCheck fallback={<p style={{color: '#ef4444', fontSize: '12px'}}>{__('You do not have permission to upload media.', 'kinetichub')}</p>}>
								<MediaUpload
									multiple={true}
									onSelect={handleMediaUpload}
									allowedTypes={['image']}
									render={({ open }) => (
										<Button variant="primary" onClick={open} style={{ padding: '8px 24px', height: 'auto', borderRadius: '8px', fontWeight: '600' }}>
											{__('Select Images', 'kinetichub')}
										</Button>
									)}
								/>
							</MediaUploadCheck>
						</div>
					) : (
						<div className={`kh-mq-marquee-inner ${edgeFade ? 'has-edge-fade' : ''}`}>
							<div className="kh-mq-marquee-track">
								<div className="kh-mq-marquee-group">
									{previewImages.map((img, i) => {
										const originIndex = i % images.length;
										return (
											<div key={`g1-${i}`} className="kh-mq-marquee-item" data-kh-mq-origin-index={originIndex}>
												<div className="kh-mq-marquee-item-inner">
													<div className={showFrame ? `kh-mq-marquee-frame shadow-${previewFrameShadow}` : ''}>
														<img src={img.url} alt={img.alt || __('Logo', 'kinetichub')} />
													</div>
												</div>
											</div>
										);
									})}
								</div>

								<div className="kh-mq-marquee-group" aria-hidden="true">
									{previewImages.map((img, i) => {
										const originIndex = i % images.length;
										return (
											<div key={`g2-${i}`} className="kh-mq-marquee-item" data-kh-mq-origin-index={originIndex}>
												<div className="kh-mq-marquee-item-inner">
													<div className={showFrame ? `kh-mq-marquee-frame shadow-${previewFrameShadow}` : ''}>
														<img src={img.url} alt={img.alt || __('Logo', 'kinetichub')} />
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</div>
					)}
				</div>
			</>
		);
	},
	save: () => null,
});