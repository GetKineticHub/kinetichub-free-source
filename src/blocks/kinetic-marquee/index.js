/**
 * Kinetic Marquee - Infinite Scrolling Gallery Block
 * Version: 1.0.2
 */

import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls, MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { PanelBody, RangeControl, ToggleControl, TextControl, Button, ColorPalette, SelectControl } from '@wordpress/components';
import { useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';



import { InspectorNotice, labelWithHelp } from '../../components/InspectorUX';

import { ProNote } from '../../components/InspectorUX';


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
			images, speed, autoMotion, reverseDirection, pauseOnHover, hoverSlowDown, itemHeight,
			liftEffect, edgeFade, openInNewTab, showFrame, frameBg, frameRadius,
			align, showProgressRail, progressRailPosition,
			showInteractionIndicator, highlightActiveCenter, siblingBlur, siblingBlurIntensity,
			
		} = attributes;

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

		/* Mirrors render.php's normalisation so the canvas shows what the frontend will
		 * actually announce. A blank or whitespace-only description means decorative,
		 * and must render as alt="" rather than being papered over with a generic word
		 * that no author ever wrote. */
		const previewAlt = (img) => (typeof img.alt === 'string' && img.alt.trim() !== '' ? img.alt.trim() : '');

		let previewImages = [...images];
		if (images.length > 0) {
			while (previewImages.length < 30) {
				previewImages = [...previewImages, ...images];
			}
		}

		let dynamicDuration = speed * (previewImages.length / 5);
		if (previewImages.length === 0) dynamicDuration = speed;

		/* Auto Motion off has to stop the canvas too, and stopping it takes both halves:
		 * this guard for the WAAPI animation, and kh-mq-static below for the keyframes.
		 * Either one alone leaves the preview moving. The guard sits after the ref test
		 * so the cleanup of the previous run - which cancels the animations this effect
		 * created - has already run by the time we return early. */
		useEffect(() => {
			if (!containerRef.current || previewImages.length === 0 || !autoMotion) return;
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
		}, [dynamicDuration, reverseDirection, previewImages.length, hoverSlowDown, pauseOnHover, autoMotion]);

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
			// The frontend's kh-mq-has-motion-control is deliberately absent here and
			// stays absent: the canvas has no Pause control, so a readiness gate would
			// only freeze it. kh-mq-static carries no such dependency - it is the
			// stylesheet's static presentation and nothing waits on it.
			autoMotion ? '' : 'kh-mq-static',
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
            {__('Add images, put them in the order you want, and give each one an optional destination link.', 'kinetichub')}
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

        
        {/* Placed under the Add button rather than at the top of the panel:
          * the capacity is a property of that control, and the button already
          * says so plainly once the limit is actually reached. Leading the
          * panel with it told an author what they could not do before telling
          * them what the panel was for. */}
        <ProNote
            text={__('An unlimited gallery, for a full logo wall or client list running in a single marquee.', 'kinetichub')}
        />
        

						<ToggleControl label={labelWithHelp(__('Open links in New Tab', 'kinetichub'), __('Applies to every item that has a destination link. Items with no link stay unclickable either way.', 'kinetichub'))} checked={openInNewTab} onChange={(v) => setAttributes({ openInNewTab: v })} />

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

										<TextControl
											label={labelWithHelp(
												__('Image description', 'kinetichub'),
												__('What a screen reader announces for this logo. It comes from the Media Library when you add the image — edit it here for different wording. Leave it blank only for a purely decorative logo. Items with a link should have one, so the link has a clear name.', 'kinetichub')
											)}
											placeholder={__('Acme Corp', 'kinetichub')}
											value={img.alt || ''}
											onChange={(v) => updateImage(index, 'alt', v)}
											__nextHasNoMarginBottom={true}
										/>

										<TextControl label={__('Destination Link', 'kinetichub')} placeholder="https://..." value={img.link} onChange={(v) => updateImage(index, 'link', v)} __nextHasNoMarginBottom={true} />

										{/* Advisory only: it never blocks saving, disables the field above, or
										  * writes an attribute. A blank description is a legitimate choice for a
										  * decorative logo — it is only a problem once the item also has a
										  * destination, because then something has to name the link. */}
										{(typeof img.link === 'string' && img.link.trim() !== '')
											&& !(typeof img.alt === 'string' && img.alt.trim() !== '') && (
											<InspectorNotice>
												{__('This item has a link but no image description. The frontend will fall back to the destination address for its accessible name.', 'kinetichub')}
											</InspectorNotice>
										)}
									</div>
								))}
							</div>
						)}
					</PanelBody>

					<PanelBody title={__('⚙️ Movement & Engine', 'kinetichub')} initialOpen={false}>
						<ToggleControl label={labelWithHelp(__('Auto Motion', 'kinetichub'), __('Automatically move the marquee. A Pause/Resume control is shown while motion is enabled.', 'kinetichub'))} checked={autoMotion} onChange={(v) => setAttributes({ autoMotion: v })} />
						<hr />
						<RangeControl label={labelWithHelp(__('Base Speed (s)', 'kinetichub'), __('Seconds for one full pass of the track — lower is faster. It is a base rather than an exact time: the track scales with how many items are in the gallery, so adding images lengthens the pass at the same apparent speed.', 'kinetichub'))} value={speed} onChange={(v) => setAttributes({ speed: v })} min={1} max={200} />
						<ToggleControl label={labelWithHelp(__('Reverse Direction', 'kinetichub'), __('Runs the track left to right instead of right to left.', 'kinetichub'))} checked={reverseDirection} onChange={(v) => setAttributes({ reverseDirection: v })} />
						<hr />
						<ToggleControl label={labelWithHelp(__('Pause on Hover / Tap', 'kinetichub'), __('Stops the track completely while the pointer is over it, so a visitor can read a logo. Turning this on switches Slow Down on Hover off — only one of the two can apply.', 'kinetichub'))} checked={pauseOnHover} onChange={(v) => { setAttributes({ pauseOnHover: v }); if (v) setAttributes({ hoverSlowDown: false }); }} />
						<ToggleControl label={labelWithHelp(__('Slow Down on Hover', 'kinetichub'), __('Drops the track to a third of its speed while the pointer is over it, rather than stopping it dead. Turning this on switches Pause on Hover off — only one of the two can apply.', 'kinetichub'))} checked={hoverSlowDown} onChange={(v) => { setAttributes({ hoverSlowDown: v }); if (v) setAttributes({ pauseOnHover: false }); }} />
					</PanelBody>

					<PanelBody title={__('🎨 Visual Styling', 'kinetichub')} initialOpen={false}>
						<RangeControl label={labelWithHelp(__('Logo Height (Desktop)', 'kinetichub'), __('Sets the height every item is scaled to, in pixels. Widths follow from each image, so logos of different proportions still line up along one row.', 'kinetichub'))} value={itemHeight} onChange={(v) => setAttributes({ itemHeight: v })} min={30} max={300} />

						

						
						{/* The seat the five sizing and treatment controls take in PRO,
						  * between the desktop height above and Edge Fade below. */}
						<ProNote
							text={__('Finer control over the row — a separate item height for phones, a width cap so one wide logo cannot dominate, adjustable spacing between items, and grayscale or faded treatments that clear as an item is hovered.', 'kinetichub')}
						/>
						

						<ToggleControl label={labelWithHelp(__('Edge Fade Effect', 'kinetichub'), __('Fades the track out at its left and right edges, so items appear to drift in and out rather than being cut off at a hard line.', 'kinetichub'))} checked={edgeFade} onChange={(v) => setAttributes({ edgeFade: v })} />
					</PanelBody>

					<PanelBody title={__('✨ Interaction & Focus', 'kinetichub')} initialOpen={false}>
						<ToggleControl label={labelWithHelp(__('Hover Lift Effect', 'kinetichub'), __('Raises the item under the pointer slightly above the row.', 'kinetichub'))} checked={liftEffect} onChange={(v) => setAttributes({ liftEffect: v })} />
						<hr />

						<ToggleControl label={labelWithHelp(__('Sibling Focus Blur', 'kinetichub'), __('Blurs every other item while one is hovered, to single it out.', 'kinetichub'))} checked={siblingBlur} onChange={(v) => setAttributes({ siblingBlur: v })} />

						{siblingBlur && !pauseOnHover && (
							<InspectorNotice>
								{__('Warning: Using Sibling Blur without "Pause on Hover" makes it very difficult for users to track moving logos. Consider enabling Pause on Hover.', 'kinetichub')}
							</InspectorNotice>
						)}

						{siblingBlur && <RangeControl label={labelWithHelp(__('Blur Intensity (px)', 'kinetichub'), __('How strongly the other items are blurred.', 'kinetichub'))} value={siblingBlurIntensity} onChange={(v) => setAttributes({ siblingBlurIntensity: v })} min={1} max={10} />}

						<hr />
						<ToggleControl label={labelWithHelp(__('Segmented Progress Rail', 'kinetichub'), __('A small bar with one segment per image you added, lighting up whichever is currently at the focus point. The repeated copies the loop is built from are not counted.', 'kinetichub'))} checked={showProgressRail} onChange={(v) => setAttributes({ showProgressRail: v })} />

						{showProgressRail && (
							<SelectControl label={labelWithHelp(__('Rail Position', 'kinetichub'), __('Which edge of the marquee the segment bar sits against.', 'kinetichub'))} value={progressRailPosition} options={[ { label: __('Right', 'kinetichub'), value: 'right' }, { label: __('Bottom', 'kinetichub'), value: 'bottom' } ]} onChange={(v) => setAttributes({ progressRailPosition: v })} />
						)}

						<ToggleControl label={labelWithHelp(__('Pause / Slow State Indicator', 'kinetichub'), __('Prints a small RUNNING, PAUSED or SLOW badge on the marquee, so a visitor can see that their hover changed something. Only useful alongside Pause on Hover or Slow Down on Hover.', 'kinetichub'))} checked={showInteractionIndicator} onChange={(v) => setAttributes({ showInteractionIndicator: v })} />
						<ToggleControl label={labelWithHelp(__('Active Center Highlight', 'kinetichub'), __('Enlarges whichever item is passing through the middle of the marquee, so the row has a focus point even when nobody is hovering it.', 'kinetichub'))} checked={highlightActiveCenter} onChange={(v) => setAttributes({ highlightActiveCenter: v })} />
					</PanelBody>

					<PanelBody title={__('🖼️ Card Frames', 'kinetichub')} initialOpen={false}>
						<ToggleControl label={labelWithHelp(__('Enable Card Frame', 'kinetichub'), __('Puts each item on its own background card, which helps when the logos have mismatched backgrounds of their own.', 'kinetichub'))} checked={showFrame} onChange={(v) => setAttributes({ showFrame: v })} />
						{showFrame && (
							<div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
								<p style={{ fontWeight: 'bold', marginTop: '0', marginBottom: '5px' }}>{__('Frame Background', 'kinetichub')}</p>
								<ColorPalette value={frameBg} onChange={(v) => setAttributes({ frameBg: v })} />
								<RangeControl label={labelWithHelp(__('Corner Radius', 'kinetichub'), __('Rounds the corners of each card.', 'kinetichub'))} value={frameRadius} onChange={(v) => setAttributes({ frameRadius: v })} min={0} max={50} />

								

								
								{/* Only once frames are switched on, where their one premium
								  * control would be. */}
								<div style={{ marginTop: '15px' }}>
									<ProNote
										text={__('Four shadow depths for the cards, from a barely-there edge to a fully floating card.', 'kinetichub')}
									/>
								</div>
								
							</div>
						)}

						
						{/* The last panel FREE has, and exactly where the three
						  * block-level PRO panels begin. Naming them here replaced a
						  * "More Features" panel whose only content was the fact that it
						  * had none. */}
						<ProNote
							text={__('Three more panels for the marquee as a whole — drop shadows behind it, an entrance animation as it scrolls into view, and per-device visibility for hiding it on phones or tablets.', 'kinetichub')}
						/>
						
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
										/* Same split render.php makes: the leading pass over the originals is the
										 * meaningful copy, everything after it is the same logo drawn again. The
										 * canvas has no anchors, so there is no tab order to suppress here — only
										 * the accessibility-tree half of the contract applies. */
										const isAccessibleCopy = i < images.length;
										return (
											<div key={`g1-${i}`} className="kh-mq-marquee-item" aria-hidden={isAccessibleCopy ? undefined : 'true'} data-kh-mq-origin-index={originIndex}>
												<div className="kh-mq-marquee-item-inner">
													<div className={showFrame ? `kh-mq-marquee-frame shadow-${previewFrameShadow}` : ''}>
														<img src={img.url} alt={previewAlt(img)} />
													</div>
												</div>
											</div>
										);
									})}
								</div>

								{/* Already hidden as a whole, which is the entire contract for this group. */}
								<div className="kh-mq-marquee-group" aria-hidden="true">
									{previewImages.map((img, i) => {
										const originIndex = i % images.length;
										return (
											<div key={`g2-${i}`} className="kh-mq-marquee-item" data-kh-mq-origin-index={originIndex}>
												<div className="kh-mq-marquee-item-inner">
													<div className={showFrame ? `kh-mq-marquee-frame shadow-${previewFrameShadow}` : ''}>
														<img src={img.url} alt={previewAlt(img)} />
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