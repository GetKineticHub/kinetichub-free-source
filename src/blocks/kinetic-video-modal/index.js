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

const StaticTeaser = ({ message }) => (
	<p
		style={{
			margin: '8px 0 0',
			padding: '10px 12px',
			background: '#f8fafc',
			border: '1px solid #e2e8f0',
			borderRadius: '6px',
			color: '#475569',
			fontSize: '12px',
			lineHeight: '1.5',
		}}
	>
		{message}
	</p>
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
			 = attributes;

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
							label={__('Playback Mode', 'kinetichub')}
							value={playbackMode}
							options={[
								{ label: __('Open in Fullscreen Modal', 'kinetichub'), value: 'modal' },
								{ label: __('Play Inline (Replaces Image)', 'kinetichub'), value: 'inline' },
							]}
							onChange={(value) => setAttributes({ playbackMode: value })}
						/>




						<StaticTeaser
							message={__(
								'Advanced playback controls such as custom start time, forced loop, and autoplay parameters are available in the separate advanced version.',
								'kinetichub'
							)}
						/>

					</PanelBody>

					<PanelBody title={__('🖼️ Cover Image', 'kinetichub')} initialOpen={false}>
						<ToggleControl
							label={__('Auto-Extract Cover (YouTube)', 'kinetichub')}
							checked={!!autoExtractCover}
							onChange={(value) => setAttributes({ autoExtractCover: value })}
							help={__(
								'Attempts to fetch the max-res thumbnail if no custom cover is uploaded.',
								'kinetichub'
							)}
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
							label={__('Dark Overlay Opacity', 'kinetichub')}
							value={imageOverlayOpacity}
							onChange={(value) => setAttributes({ imageOverlayOpacity: value })}
							min={0}
							max={1}
							step={0.1}
						/>

						<SelectControl
							label={__('Aspect Ratio', 'kinetichub')}
							value={aspectRatio}
							options={[
								{ label: __('16:9 (Standard Video)', 'kinetichub'), value: '16x9' },
								{ label: __('4:3 (Classic)', 'kinetichub'), value: '4x3' },
								{ label: __('21:9 (Cinematic)', 'kinetichub'), value: '21x9' },
								{ label: __('1:1 (Square)', 'kinetichub'), value: '1x1' },
							]}
							onChange={(value) => setAttributes({ aspectRatio: value })}
						/>




						<StaticTeaser
							message={__(
								'Additional cover hover zoom styles are available in the separate advanced version.',
								'kinetichub'
							)}
						/>

					</PanelBody>

					<PanelBody title={__('▶️ Play Button Design', 'kinetichub')} initialOpen={false}>
						<SelectControl
							label={__('Button Style', 'kinetichub')}
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



						<StaticTeaser
							message={__(
								'Magnetic button movement and idle pulse animation are available in the separate advanced version.',
								'kinetichub'
							)}
						/>

					</PanelBody>

					{playbackMode === 'modal' && (
						<PanelBody title={__('🪟 Modal Settings', 'kinetichub')} initialOpen={false}>
							<SelectControl
								label={__('Backdrop Style', 'kinetichub')}
								value={backdropStyle}
								options={[
									{ label: __('Dark Glassmorphism', 'kinetichub'), value: 'glass-dark' },
									{ label: __('Light Glassmorphism', 'kinetichub'), value: 'glass-light' },
									{ label: __('Solid Dark', 'kinetichub'), value: 'solid-dark' },
									{ label: __('Solid Light', 'kinetichub'), value: 'solid-light' },
								]}
								onChange={(value) => setAttributes({ backdropStyle: value })}
							/>




							<StaticTeaser
								message={__(
									'Additional modal entrance animations are available in the separate advanced version. The free build uses the default zoom entrance.',
									'kinetichub'
								)}
							/>


							<ToggleControl
								label={__('Close on Backdrop Click', 'kinetichub')}
								checked={!!closeOnBackdrop}
								onChange={(value) => setAttributes({ closeOnBackdrop: value })}
							/>

							<ToggleControl
								label={__('Show Close Button Outside', 'kinetichub')}
								checked={!!showCloseButtonOutside}
								onChange={(value) => setAttributes({ showCloseButtonOutside: value })}
							/>
						</PanelBody>
					)}

					<PanelBody title={__('♿ A11y & Preload', 'kinetichub')} initialOpen={false}>
						<SelectControl
							label={__('Local Video Preload', 'kinetichub')}
							value={preloadLocalVideo}
							options={[
								{ label: __('Metadata Only (Recommended)', 'kinetichub'), value: 'metadata' },
								{ label: __('None', 'kinetichub'), value: 'none' },
								{ label: __('Auto', 'kinetichub'), value: 'auto' },
							]}
							onChange={(value) => setAttributes({ preloadLocalVideo: value })}
						/>

						<TextControl
							label={__('Dialog Aria Label', 'kinetichub')}
							value={dialogAriaLabel}
							onChange={(value) => setAttributes({ dialogAriaLabel: value })}
						/>

						<TextControl
							label={__('Play Button Aria', 'kinetichub')}
							value={playButtonAriaLabel}
							onChange={(value) => setAttributes({ playButtonAriaLabel: value })}
						/>

						<TextControl
							label={__('Close Button Aria', 'kinetichub')}
							value={closeButtonAriaLabel}
							onChange={(value) => setAttributes({ closeButtonAriaLabel: value })}
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

					<KineticEditorNotice
						message={__(
							'Modal playback and interaction physics run on the frontend only.',
							'kinetichub'
						)}
					/>
				</div>
			</>
		);
	},

	save: () => null,
});