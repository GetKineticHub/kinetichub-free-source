/**
 * Kinetic Video Modal - Editor Interface
 * Version: 1.0.0
 */

import './style.scss';
import { registerBlockType } from '@wordpress/blocks';
import {
	useBlockProps,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	ToggleControl,
	SelectControl,
	ColorPalette,
	RangeControl,
	Button,
	Notice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';
import { KineticEditorNotice } from '../../components/EditorNotice';
import { labelWithHelp, InspectorNote } from '../../components/InspectorUX';

import { ProNote } from '../../components/InspectorUX';


const videoIcon = (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M15 10L19.5 7.5V16.5L15 14V10Z"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<path
			d="M4 6C4 4.89543 4.89543 4 6 4H13C14.1046 4 15 4.89543 15 6V18C15 19.1046 14.1046 20 13 20H6C4.89543 20 4 19.1046 4 18V6Z"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

registerBlockType(metadata.name, {
	icon: videoIcon,

	edit: (props) => {
		const { attributes, setAttributes, isSelected } = props;

		const {
			videoUrl,
			autoExtractCover,
			playbackMode,
			coverImage,
			buttonColor,
			iconColor,
			buttonSize,
			imageOverlayOpacity,
			buttonStyle,
			backdropStyle,
			aspectRatio,
			preloadLocalVideo,
			dialogAriaLabel,
			playButtonAriaLabel,
			closeButtonAriaLabel,
			closeOnBackdrop,
			showCloseButtonOutside,
			
		} = attributes;

		let editorHoverZoomLevel = 'none';
		let editorModalEntrance = 'zoom';
		let editorTeaserBadgeText = '';
		let editorMagneticPull = false;
		let editorPulseAnimation = false;

		

		const blockProps = useBlockProps({
			className: [
				'kh-video-modal-container',
				`ratio-${aspectRatio || '16x9'}`,
				`btn-style-${buttonStyle || 'solid'}`,
				`zoom-${editorHoverZoomLevel}`,
				
			]
				.filter(Boolean)
				.join(' '),
			style: {
				'--kh-vm-btn-c': buttonColor || '#10b981',
				'--kh-vm-icon-c': iconColor || '#ffffff',
				'--kh-vm-btn-s': `${buttonSize || 80}px`,
				'--kh-vm-overlay': imageOverlayOpacity ?? 0.3,
				position: 'relative',
			},
		});

		const onSelectCover = (media) => {
			if (media && media.url) {
				setAttributes({
					coverImage: {
						url: media.url,
						alt: media.alt || '',
					},
				});
			}
		};

		const getPreviewButtonStyle = () => {
			const base = {
				width: `${buttonSize || 80}px`,
				height: `${buttonSize || 80}px`,
				color: iconColor || '#ffffff',
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				borderRadius: '999px',
			};

			if (buttonStyle === 'outline') {
				return {
					...base,
					background: 'transparent',
					border: `2px solid ${buttonColor || '#10b981'}`,
					boxShadow: 'none',
				};
			}

			if (buttonStyle === 'glass') {
				return {
					...base,
					background: 'rgba(255, 255, 255, 0.12)',
					border: '1px solid rgba(255, 255, 255, 0.28)',
					backdropFilter: 'blur(12px)',
					WebkitBackdropFilter: 'blur(12px)',
					boxShadow: '0 8px 24px rgba(0, 0, 0, 0.20)',
				};
			}

			return {
				...base,
				background: buttonColor || '#10b981',
				border: `2px solid ${buttonColor || '#10b981'}`,
				boxShadow: '0 8px 24px rgba(0, 0, 0, 0.20)',
			};
		};

		return (
			<>
				<InspectorControls>
					<PanelBody title={__('📺 Video Source', 'kinetichub')} initialOpen={true}>
						<TextControl
							label={__('Video URL', 'kinetichub')}
							value={videoUrl}
							onChange={(value) => setAttributes({ videoUrl: value })}
							help={__(
								'Supports YouTube, Vimeo, and direct MP4/WebM/OGG video URLs.',
								'kinetichub'
							)}
						/>

						<SelectControl
							label={labelWithHelp(
								__('Playback Mode', 'kinetichub'),
								__('Fullscreen Modal darkens the page and opens the video in a dialog above it, which the visitor closes to return. Inline keeps the video in the block: it takes the place of the cover image at the same size and aspect ratio, and there is nothing to close.', 'kinetichub')
							)}
							value={playbackMode}
							options={[
								{ label: __('Open in Fullscreen Modal', 'kinetichub'), value: 'modal' },
								{ label: __('Play Inline (Replaces Image)', 'kinetichub'), value: 'inline' },
							]}
							onChange={(value) => setAttributes({ playbackMode: value })}
						/>

						{/* Which controls this mode brings into play is the part an
						  * author cannot see: the Modal Settings panel appears and
						  * disappears with it, several panels down the sidebar. */}
						<InspectorNote
							text={
								playbackMode === 'inline'
									? __('Inline playback has no dialog, so the Modal Settings panel does not apply and is hidden. The Accessibility fields for the dialog and its close button are unused in this mode.', 'kinetichub')
									: __('The Modal Settings panel below controls the backdrop and how the dialog is closed.', 'kinetichub')
							}
						/>

						

						
						{/* The seat the Playback Settings group takes in PRO: four
						  * controls over how the clip itself starts and runs, named
						  * once rather than four times. */}
						<div style={{ marginTop: '16px' }}>
							<ProNote
								text={__('Control over how the clip runs — start it automatically, loop it, open it muted, and skip a set number of seconds into it every time.', 'kinetichub')}
							/>
						</div>
						
					</PanelBody>

					<PanelBody title={__('🖼️ Cover Image', 'kinetichub')} initialOpen={false}>
						<ToggleControl
							label={labelWithHelp(
								__('Auto-Extract Cover (YouTube)', 'kinetichub'),
								__('Uses the highest-resolution thumbnail YouTube publishes for the video, when no custom cover has been uploaded below. A custom cover always wins.', 'kinetichub')
							)}
							checked={!!autoExtractCover}
							onChange={(value) => setAttributes({ autoExtractCover: value })}
						/>

						<div style={{ marginBottom: '20px' }}>
							<p style={{ fontWeight: 'bold', fontSize: '13px' }}>
								{__('Custom Cover Image', 'kinetichub')}
							</p>

							<MediaUploadCheck>
								<MediaUpload
									onSelect={onSelectCover}
									allowedTypes={['image']}
									value={coverImage?.url || ''}
									render={({ open }) => (
										<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
											<Button variant="secondary" onClick={open}>
												{coverImage?.url
													? __('Replace Image', 'kinetichub')
													: __('Upload Cover', 'kinetichub')}
											</Button>

											{coverImage?.url && (
												<Button
													isDestructive
													variant="link"
													onClick={() => setAttributes({ coverImage: null })}
												>
													{__('Remove', 'kinetichub')}
												</Button>
											)}
										</div>
									)}
								/>
							</MediaUploadCheck>
						</div>

						<RangeControl
							label={labelWithHelp(
								__('Dark Overlay Opacity', 'kinetichub'),
								__('Darkens the cover image so the play button stays readable over it. 0 leaves the image untouched.', 'kinetichub')
							)}
							value={imageOverlayOpacity}
							onChange={(value) => setAttributes({ imageOverlayOpacity: value })}
							min={0}
							max={1}
							step={0.1}
						/>

						<SelectControl
							label={labelWithHelp(
								__('Aspect Ratio', 'kinetichub'),
								__('Shape of the cover area in the page. Pick the ratio the clip was filmed in, or the cover will be cropped to fit.', 'kinetichub')
							)}
							value={aspectRatio}
							options={[
								{ label: __('16:9 (Standard Video)', 'kinetichub'), value: '16x9' },
								{ label: __('4:3 (Classic)', 'kinetichub'), value: '4x3' },
								{ label: __('21:9 (Cinematic)', 'kinetichub'), value: '21x9' },
								{ label: __('1:1 (Square)', 'kinetichub'), value: '1x1' },
							]}
							onChange={(value) => setAttributes({ aspectRatio: value })}
						/>

						

						
						{/* The seat the hover zoom takes in PRO, last in this panel
						  * either way. */}
						<div style={{ marginTop: '16px' }}>
							<ProNote
								text={__('A slow zoom on the cover image while the pointer rests over it, subtle or drawn out.', 'kinetichub')}
							/>
						</div>
						
					</PanelBody>

					<PanelBody title={__('▶️ Play Button Design', 'kinetichub')} initialOpen={false}>
						<SelectControl
							label={labelWithHelp(
								__('Button Style', 'kinetichub'),
								__('Solid fills the circle with the background colour. Frosted Glass is translucent and blurs the cover behind it. Minimal Outline draws the ring only, with nothing inside.', 'kinetichub')
							)}
							value={buttonStyle}
							options={[
								{ label: __('Solid Color', 'kinetichub'), value: 'solid' },
								{ label: __('Frosted Glass', 'kinetichub'), value: 'glass' },
								{ label: __('Minimal Outline', 'kinetichub'), value: 'outline' },
							]}
							onChange={(value) => setAttributes({ buttonStyle: value })}
						/>

						<RangeControl
							label={__('Button Size (px)', 'kinetichub')}
							value={buttonSize}
							onChange={(value) => setAttributes({ buttonSize: value })}
							min={40}
							max={150}
						/>

						<p style={{ fontWeight: 'bold', marginTop: '10px', marginBottom: '5px' }}>
							{__('Button Background', 'kinetichub')}
						</p>
						<ColorPalette
							value={buttonColor}
							onChange={(value) => setAttributes({ buttonColor: value || '#10b981' })}
						/>

						<p style={{ fontWeight: 'bold', marginTop: '10px', marginBottom: '5px' }}>
							{__('Play Icon Color', 'kinetichub')}
						</p>
						<ColorPalette
							value={iconColor}
							onChange={(value) => setAttributes({ iconColor: value || '#ffffff' })}
						/>

						
					</PanelBody>

					<PanelBody title={__('⚡ Advanced Interactions', 'kinetichub')} initialOpen={false}>
						

						
						{/* The only content this panel has in FREE, so it names every
						  * embellishment PRO puts on the play button -- the badge
						  * included, whose control sits one panel up. */}
						<ProNote
							text={__('Extra life on the play button — a magnetic pull toward the cursor, a slow idle pulse, and a short caption badge such as "Watch Trailer".', 'kinetichub')}
						/>
						
					</PanelBody>

					{playbackMode === 'modal' && (
						<PanelBody title={__('🪟 Modal Settings', 'kinetichub')} initialOpen={false}>
							<SelectControl
								label={labelWithHelp(
									__('Backdrop Style', 'kinetichub'),
									__('What the page behind the dialog looks like while the video is open. Glassmorphism blurs the page through a tint; Solid covers it flatly.', 'kinetichub')
								)}
								value={backdropStyle}
								options={[
									{ label: __('Dark Glassmorphism', 'kinetichub'), value: 'glass-dark' },
									{ label: __('Light Glassmorphism', 'kinetichub'), value: 'glass-light' },
									{ label: __('Solid Dark', 'kinetichub'), value: 'solid-dark' },
									{ label: __('Solid Light', 'kinetichub'), value: 'solid-light' },
								]}
								onChange={(value) => setAttributes({ backdropStyle: value })}
							/>

							

							
							{/* Exactly where the entrance select sits in PRO, between the
							  * backdrop and the close behaviour. */}
							<ProNote
								text={__('A choice of entrance for the dialog — slide up, 3D flip or a plain fade, in place of the standard zoom.', 'kinetichub')}
							/>
							

							<ToggleControl
								label={labelWithHelp(
									__('Close on Backdrop Click', 'kinetichub'),
									__('Lets a click anywhere outside the video close the dialog. The close button and the Escape key work either way.', 'kinetichub')
								)}
								checked={!!closeOnBackdrop}
								onChange={(value) => setAttributes({ closeOnBackdrop: value })}
							/>

							<ToggleControl
								label={labelWithHelp(
									__('Show Close Button Outside', 'kinetichub'),
									__('Places the close button just outside the corner of the video instead of over the picture.', 'kinetichub')
								)}
								checked={!!showCloseButtonOutside}
								onChange={(value) => setAttributes({ showCloseButtonOutside: value })}
							/>
						</PanelBody>
					)}

					<PanelBody title={__('♿ Accessibility & Preload', 'kinetichub')} initialOpen={false}>
						<SelectControl
							label={labelWithHelp(
								__('Local Video Preload', 'kinetichub'),
								__('How much of a self-hosted file the browser fetches before anyone presses play. Metadata Only keeps the page light. YouTube and Vimeo ignore this — they load nothing until the video is opened.', 'kinetichub')
							)}
							value={preloadLocalVideo}
							options={[
								{ label: __('Metadata Only (Recommended)', 'kinetichub'), value: 'metadata' },
								{ label: __('None', 'kinetichub'), value: 'none' },
								{ label: __('Auto', 'kinetichub'), value: 'auto' },
							]}
							onChange={(value) => setAttributes({ preloadLocalVideo: value })}
						/>

						{/* These three are the block's whole accessible-name story: the
						  * play button and the close button carry an icon and no text, and
						  * the dialog has no visible heading, so a screen reader announces
						  * whatever is typed here and nothing else. That is guidance an
						  * author has to READ to get right, so it stays permanently inline
						  * rather than folded into a "?" they have no reason to open. */}
						<TextControl
							label={__('Dialog Aria Label', 'kinetichub')}
							value={dialogAriaLabel}
							onChange={(value) => setAttributes({ dialogAriaLabel: value })}
							help={__('Names the video dialog for screen readers. Say which video it is, not what it is — "Product tour video", not "Video dialog".', 'kinetichub')}
						/>

						<TextControl
							label={__('Play Button Aria', 'kinetichub')}
							value={playButtonAriaLabel}
							onChange={(value) => setAttributes({ playButtonAriaLabel: value })}
							help={__('The play button shows an icon and no text, so this is all a screen reader has to go on. Name the clip — "Play the 2 minute product tour".', 'kinetichub')}
						/>

						<TextControl
							label={__('Close Button Aria', 'kinetichub')}
							value={closeButtonAriaLabel}
							onChange={(value) => setAttributes({ closeButtonAriaLabel: value })}
							help={__('Names the button that dismisses the dialog. "Close video" is usually right. Leave it in the language of the page.', 'kinetichub')}
						/>
					</PanelBody>
				</InspectorControls>

				<div {...blockProps}>
					{isSelected && !videoUrl && (
						<Notice
							status="warning"
							isDismissible={false}
							style={{
								position: 'absolute',
								top: 10,
								left: 10,
								right: 10,
								zIndex: 10,
							}}
						>
							{__('Please enter a Video URL in the settings panel to activate the player.', 'kinetichub')}
						</Notice>
					)}

					<div className="kh-vm-preview-layer">
						{coverImage?.url ? (
							<img src={coverImage.url} alt={coverImage.alt || ''} className="kh-vm-cover-img" />
						) : (
							<div
								className="kh-vm-fallback-bg"
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									background: '#1e293b',
									width: '100%',
									height: '100%',
								}}
							>
								<svg
									width="48"
									height="48"
									viewBox="0 0 24 24"
									fill="none"
									stroke="#475569"
									strokeWidth="1"
								>
									<path
										d="M15 10L19.5 7.5V16.5L15 14V10Z"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
									<path
										d="M4 6C4 4.89543 4.89543 4 6 4H13C14.1046 4 15 4.89543 15 6V18C15 19.1046 14.1046 20 13 20H6C4.89543 20 4 19.1046 4 18V6Z"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</div>
						)}

						<div
							className="kh-vm-overlay"
							style={{
								opacity: imageOverlayOpacity ?? 0.3,
								background: '#000',
								position: 'absolute',
								inset: 0,
							}}
						/>

						<div className="kh-vm-play-trigger-zone">
							<button
								type="button"
								className="kh-vm-play-button"
								style={getPreviewButtonStyle()}
							>
								<span className="kh-vm-play-icon" style={{ color: iconColor || '#ffffff' }}>
									<svg
										viewBox="0 0 24 24"
										fill="currentColor"
										xmlns="http://www.w3.org/2000/svg"
										width="32"
										height="32"
									>
										<path d="M8 5v14l11-7z" />
									</svg>
								</span>
							</button>

							
						</div>
					</div>

					{/*
					  * Gated on selection. Without it every Video Modal in the post
					  * announces itself into its own role="status" region the moment the
					  * editor loads, so a page with several of them fires several
					  * simultaneous live-region messages saying the same thing.
					  *
					  * Anchor unchanged: .kh-video-modal-container is position: relative
					  * with an aspect-ratio height, and the toast sits over poster
					  * artwork rather than over the play button, which is centred.
					  */}
					{isSelected && (
						<KineticEditorNotice
							message={__(
								'Video modal playback and motion effects run on the live frontend.',
								'kinetichub'
							)}
						/>
					)}
				</div>
			</>
		);
	},

	save: () => null,
});