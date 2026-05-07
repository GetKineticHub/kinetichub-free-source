/**
 * KineticHub - Admin Dashboard
 * WordPress.org FREE build
 */

import './admin.scss';

import domReady from '@wordpress/dom-ready';
import apiFetch from '@wordpress/api-fetch';
import { createRoot, useEffect, useMemo, useState } from '@wordpress/element';
import {
	Button,
	Notice,
	RangeControl,
	SelectControl,
	Spinner,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const dashboardData = window.kinetichubDashboardData || {};

if (dashboardData.restUrl) {
	apiFetch.use(apiFetch.createRootURLMiddleware(dashboardData.restUrl));
}

if (dashboardData.nonce) {
	apiFetch.use(apiFetch.createNonceMiddleware(dashboardData.nonce));
}

const DEFAULT_SETTINGS = {
	globalLerp: 0.08,
	accentColor: '#10b981',
	enableMobileMotion: true,
	performanceMode: 'balanced',
	assetOptimization: true,
	glassIntensity: 20,
	activeBlocks: {},
};

const BLOCKS = [
	{
		id: 'kinetic-box',
		name: __('Kinetic Box', 'kinetichub'),
		description: __('Animated container block with motion-ready layout controls.', 'kinetichub'),
		icon: 'dashicons-move',
		image: 'assets/images/Kinetic-box.jpg',
	},
	{
		id: 'kinetic-typography',
		name: __('Kinetic Typography', 'kinetichub'),
		description: __('Animated text block with server-rendered splitting and accessibility fallback.', 'kinetichub'),
		icon: 'dashicons-editor-textcolor',
		image: 'assets/images/Kinetic-typo.jpg',
	},
	{
		id: 'kinetic-magnetic-button',
		name: __('Magnetic Button', 'kinetichub'),
		description: __('Interactive button block with configurable styling and motion behavior.', 'kinetichub'),
		icon: 'dashicons-button',
		image: 'assets/images/Kinetic-button.jpg',
	},
	{
		id: 'kinetic-marquee',
		name: __('Kinetic Marquee', 'kinetichub'),
		description: __('Auto-scrolling logo and media marquee block.', 'kinetichub'),
		icon: 'dashicons-image-flip-horizontal',
		image: 'assets/images/Kinetic-marquee.jpg',
	},
	{
		id: 'kinetic-scroll-divider',
		name: __('Scroll Divider', 'kinetichub'),
		description: __('Animated divider line triggered by viewport scroll.', 'kinetichub'),
		icon: 'dashicons-minus',
		image: 'assets/images/Kinetic-divider.jpg',
	},
	{
		id: 'kinetic-video-modal',
		name: __('Video Modal', 'kinetichub'),
		description: __('Lazy video modal and inline playback block.', 'kinetichub'),
		icon: 'dashicons-controls-play',
		image: 'assets/images/Kinetic-video.jpg',
	},
	{
		id: 'kinetic-hero-mesh',
		name: __('Hero Mesh', 'kinetichub'),
		description: __('Generative hero background block with motion-ready content layering.', 'kinetichub'),
		icon: 'dashicons-admin-site-alt3',
		image: 'assets/images/Kinetic-mesh.jpg',
	},
	{
		id: 'kinetic-before-after',
		name: __('Before/After Slider', 'kinetichub'),
		description: __('Accessible comparison slider for images.', 'kinetichub'),
		icon: 'dashicons-images-alt2',
		image: 'assets/images/Kinetic-before.jpg',
	},
	{
		id: 'kinetic-audio-player',
		name: __('Audio Player', 'kinetichub'),
		description: __('Custom audio player block for WordPress content.', 'kinetichub'),
		icon: 'dashicons-media-audio',
		image: 'assets/images/Kinetic-audio.jpg',
	},
	{
		id: 'kinetic-split-scroll',
		name: __('Split Scroll', 'kinetichub'),
		description: __('Split layout with pinned media and scrolling content.', 'kinetichub'),
		icon: 'dashicons-columns',
		image: 'assets/images/Kinetic-split.jpg',
	},
	{
		id: 'kinetic-cursor-reveal',
		name: __('Cursor Reveal', 'kinetichub'),
		description: __('Interactive media reveal list with pointer-aware behavior.', 'kinetichub'),
		icon: 'dashicons-visibility',
		image: 'assets/images/Kinetic-cursor.jpg',
	},
	{
		id: 'kinetic-ambient-aura',
		name: __('Ambient Aura', 'kinetichub'),
		description: __('Soft ambient visual background block.', 'kinetichub'),
		icon: 'dashicons-lightbulb',
		image: 'assets/images/Kinetic-aura.jpg',
	},
];

const TABS = [
	{
		id: 'overview',
		label: __('Overview', 'kinetichub'),
	},
	{
		id: 'blocks',
		label: __('My Suite', 'kinetichub'),
	},
	{
		id: 'settings',
		label: __('Global Settings', 'kinetichub'),
	},
	{
		id: 'system',
		label: __('System Info', 'kinetichub'),
	},
];

function normalizeSettings(settings) {
	const incoming = settings && typeof settings === 'object' ? settings : {};
	const activeBlocks = { ...DEFAULT_SETTINGS.activeBlocks };

	BLOCKS.forEach((block) => {
		activeBlocks[block.id] =
			incoming.activeBlocks && Object.prototype.hasOwnProperty.call(incoming.activeBlocks, block.id)
				? !!incoming.activeBlocks[block.id]
				: true;
	});

	return {
		...DEFAULT_SETTINGS,
		...incoming,
		activeBlocks,
		globalLerp:
			typeof incoming.globalLerp === 'number'
				? Math.max(0.01, Math.min(0.2, incoming.globalLerp))
				: DEFAULT_SETTINGS.globalLerp,
		glassIntensity:
			typeof incoming.glassIntensity === 'number'
				? Math.max(0, Math.min(50, incoming.glassIntensity))
				: DEFAULT_SETTINGS.glassIntensity,
		accentColor:
			typeof incoming.accentColor === 'string' && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(incoming.accentColor)
				? incoming.accentColor
				: DEFAULT_SETTINGS.accentColor,
		enableMobileMotion:
			typeof incoming.enableMobileMotion === 'boolean'
				? incoming.enableMobileMotion
				: DEFAULT_SETTINGS.enableMobileMotion,
		assetOptimization:
			typeof incoming.assetOptimization === 'boolean'
				? incoming.assetOptimization
				: DEFAULT_SETTINGS.assetOptimization,
		performanceMode:
			['balanced', 'eco', 'performance'].includes(incoming.performanceMode)
				? incoming.performanceMode
				: DEFAULT_SETTINGS.performanceMode,
	};
}

function isWebGLAvailable() {
	try {
		const canvas = document.createElement('canvas');
		return !!(
			window.WebGLRenderingContext &&
			(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
		);
	} catch (error) {
		return false;
	}
}

function Dashboard() {
	const [settings, setSettings] = useState(DEFAULT_SETTINGS);
	const [activeTab, setActiveTab] = useState('overview');
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [notice, setNotice] = useState(null);
	const [restStatus, setRestStatus] = useState(__('Checking...', 'kinetichub'));
	const [restOnline, setRestOnline] = useState(false);
	const [webglActive, setWebglActive] = useState(false);

	const pluginUrl = dashboardData.pluginUrl || '';

	useEffect(() => {
		setWebglActive(isWebGLAvailable());

		apiFetch({ path: '/kinetichub/v1/settings' })
			.then((response) => {
				setSettings(normalizeSettings(response));
				setRestStatus(__('Online', 'kinetichub'));
				setRestOnline(true);
				setIsLoading(false);
			})
			.catch(() => {
				setSettings(normalizeSettings(DEFAULT_SETTINGS));
				setRestStatus(__('Offline or unavailable', 'kinetichub'));
				setRestOnline(false);
				setIsLoading(false);
			});
	}, []);

	const activeCount = useMemo(() => {
		return BLOCKS.filter((block) => settings.activeBlocks?.[block.id] !== false).length;
	}, [settings.activeBlocks]);

	const updateSetting = (key, value) => {
		setSettings((current) => ({
			...current,
			[key]: value,
		}));
	};

	const updateActiveBlock = (blockId, value) => {
		setSettings((current) => ({
			...current,
			activeBlocks: {
				...current.activeBlocks,
				[blockId]: value,
			},
		}));
	};

	const saveSettings = () => {
		setIsSaving(true);
		setNotice(null);

		apiFetch({
			path: '/kinetichub/v1/settings',
			method: 'POST',
			data: settings,
		})
			.then((response) => {
				setSettings(normalizeSettings(response?.settings || settings));
				setNotice({
					status: 'success',
					message: __('Settings saved successfully.', 'kinetichub'),
				});
				setIsSaving(false);
			})
			.catch((error) => {
				setNotice({
					status: 'error',
					message:
						error?.message ||
						__('Settings could not be saved. Please refresh the page and try again.', 'kinetichub'),
				});
				setIsSaving(false);
			});
	};

	const renderOverview = () => (
		<div className="kh-dashboard-grid kh-dashboard-grid-3">
			<div className="kh-stat-card">
				<span className="kh-stat-label">{__('Included blocks', 'kinetichub')}</span>
				<strong>{BLOCKS.length}</strong>
				<p>{__('Motion-ready blocks available in this build.', 'kinetichub')}</p>
			</div>

			<div className="kh-stat-card">
				<span className="kh-stat-label">{__('Active blocks', 'kinetichub')}</span>
				<strong>{activeCount}</strong>
				<p>{__('Blocks currently enabled for the editor.', 'kinetichub')}</p>
			</div>

			<div className="kh-stat-card">
				<span className="kh-stat-label">{__('Motion profile', 'kinetichub')}</span>
				<strong>{settings.performanceMode}</strong>
				<p>{__('Global frontend animation profile.', 'kinetichub')}</p>
			</div>

			<div className="kh-dashboard-panel kh-dashboard-wide">
				<h2>{__('KineticHub Free Edition', 'kinetichub')}</h2>
				<p>
					{__(
						'Manage the included animated blocks and global motion preferences for your WordPress site.',
						'kinetichub'
					)}
				</p>

				<div className="kh-overview-actions">
					<Button variant="primary" onClick={() => setActiveTab('blocks')}>
						{__('Manage Blocks', 'kinetichub')}
					</Button>
					<Button variant="secondary" onClick={() => setActiveTab('settings')}>
						{__('Global Settings', 'kinetichub')}
					</Button>
				</div>
			</div>
		</div>
	);

	const renderBlocks = () => (
		<div className="kh-dashboard-panel">
			<div className="kh-panel-heading">
				<div>
					<h2>{__('My Suite', 'kinetichub')}</h2>
					<p>{__('Enable or disable included blocks for the editor.', 'kinetichub')}</p>
				</div>

				<Button variant="primary" onClick={saveSettings} isBusy={isSaving} disabled={isSaving}>
					{isSaving ? __('Saving...', 'kinetichub') : __('Save Changes', 'kinetichub')}
				</Button>
			</div>

			<div className="kh-block-grid">
				{BLOCKS.map((block) => {
					const enabled = settings.activeBlocks?.[block.id] !== false;
					const imageUrl = block.image ? `${pluginUrl}${block.image}` : '';

					return (
						<div className="kh-block-card" key={block.id}>
							<div className="kh-block-image">
								{imageUrl ? (
									<img src={imageUrl} alt="" loading="lazy" />
								) : (
									<span className={`dashicons ${block.icon}`} aria-hidden="true" />
								)}
							</div>

							<div className="kh-block-content">
								<div className="kh-block-title-row">
									<h3>{block.name}</h3>
									<span className="kh-included-badge">{__('Included', 'kinetichub')}</span>
								</div>

								<p>{block.description}</p>

								<ToggleControl
									label={enabled ? __('Enabled', 'kinetichub') : __('Disabled', 'kinetichub')}
									checked={enabled}
									onChange={(value) => updateActiveBlock(block.id, value)}
								/>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);

	const renderSettings = () => (
		<div className="kh-dashboard-panel">
			<div className="kh-panel-heading">
				<div>
					<h2>{__('Global Settings', 'kinetichub')}</h2>
					<p>{__('Tune shared motion behavior and visual tokens.', 'kinetichub')}</p>
				</div>

				<Button variant="primary" onClick={saveSettings} isBusy={isSaving} disabled={isSaving}>
					{isSaving ? __('Saving...', 'kinetichub') : __('Save Settings', 'kinetichub')}
				</Button>
			</div>

			<div className="kh-settings-grid">
				<div className="kh-setting-card">
					<h3>{__('Motion Engine', 'kinetichub')}</h3>

					<SelectControl
						label={__('Performance Mode', 'kinetichub')}
						value={settings.performanceMode}
						options={[
							{ label: __('Balanced', 'kinetichub'), value: 'balanced' },
							{ label: __('Eco', 'kinetichub'), value: 'eco' },
							{ label: __('Performance', 'kinetichub'), value: 'performance' },
						]}
						onChange={(value) => updateSetting('performanceMode', value)}
					/>

					<RangeControl
						label={__('Global LERP Amount', 'kinetichub')}
						value={settings.globalLerp}
						onChange={(value) => updateSetting('globalLerp', value)}
						min={0.01}
						max={0.2}
						step={0.01}
						help={__('Lower values feel smoother. Higher values feel faster.', 'kinetichub')}
					/>

					<ToggleControl
						label={__('Enable Mobile Motion', 'kinetichub')}
						checked={!!settings.enableMobileMotion}
						onChange={(value) => updateSetting('enableMobileMotion', value)}
					/>

					<ToggleControl
						label={__('Asset Optimization', 'kinetichub')}
						checked={!!settings.assetOptimization}
						onChange={(value) => updateSetting('assetOptimization', value)}
						help={__('Loads shared frontend styles early for smoother rendering.', 'kinetichub')}
					/>
				</div>

				<div className="kh-setting-card">
					<h3>{__('Visual Tokens', 'kinetichub')}</h3>

					<TextControl
						label={__('Accent Color', 'kinetichub')}
						value={settings.accentColor}
						onChange={(value) => updateSetting('accentColor', value)}
						help={__('Use a hex color such as #10b981.', 'kinetichub')}
					/>

					<RangeControl
						label={__('Glass Blur Intensity', 'kinetichub')}
						value={settings.glassIntensity}
						onChange={(value) => updateSetting('glassIntensity', value)}
						min={0}
						max={50}
						step={1}
					/>

					<div className="kh-color-preview" style={{ backgroundColor: settings.accentColor }}>
						{__('Accent preview', 'kinetichub')}
					</div>
				</div>
			</div>
		</div>
	);

	const renderSystem = () => (
		<div className="kh-dashboard-panel">
			<h2>{__('System Info', 'kinetichub')}</h2>
			<p>{__('Basic environment information for troubleshooting.', 'kinetichub')}</p>

			<table className="kh-system-table">
				<tbody>
					<tr>
						<th>{__('Plugin Version', 'kinetichub')}</th>
						<td>{dashboardData.version || '1.0.0'}</td>
					</tr>
					<tr>
						<th>{__('REST API', 'kinetichub')}</th>
						<td className={restOnline ? 'is-good' : 'is-warning'}>{restStatus}</td>
					</tr>
					<tr>
						<th>{__('WebGL Support', 'kinetichub')}</th>
						<td className={webglActive ? 'is-good' : 'is-warning'}>
							{webglActive ? __('Available', 'kinetichub') : __('Unavailable', 'kinetichub')}
						</td>
					</tr>
					<tr>
						<th>{__('WordPress Requirement', 'kinetichub')}</th>
						<td>{__('Requires WordPress 6.2 or newer.', 'kinetichub')}</td>
					</tr>
					<tr>
						<th>{__('Enabled Blocks', 'kinetichub')}</th>
						<td>
							{activeCount} / {BLOCKS.length}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);

	const renderActiveTab = () => {
		if ('blocks' === activeTab) {
			return renderBlocks();
		}

		if ('settings' === activeTab) {
			return renderSettings();
		}

		if ('system' === activeTab) {
			return renderSystem();
		}

		return renderOverview();
	};

	if (isLoading) {
		return (
			<div className="kh-dashboard-wrapper">
				<div className="kh-dashboard-loading">
					<Spinner />
					<p>{__('Loading KineticHub dashboard...', 'kinetichub')}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="kh-dashboard-wrapper" style={{ '--kh-accent': settings.accentColor }}>
			<header className="kh-dashboard-header">
				<div>
					<span className="kh-eyebrow">{__('Animated Blocks for WordPress', 'kinetichub')}</span>
					<h1>{__('KineticHub', 'kinetichub')}</h1>
					<p>{__('Configure included blocks and shared motion settings.', 'kinetichub')}</p>
				</div>

				<div className="kh-header-status">
					<span className={restOnline ? 'kh-status-dot is-good' : 'kh-status-dot is-warning'} />
					{restStatus}
				</div>
			</header>

			<nav className="kh-dashboard-tabs" aria-label={__('Dashboard sections', 'kinetichub')}>
				{TABS.map((tab) => (
					<Button
						key={tab.id}
						variant={activeTab === tab.id ? 'primary' : 'secondary'}
						onClick={() => setActiveTab(tab.id)}
					>
						{tab.label}
					</Button>
				))}
			</nav>

			{notice && (
				<Notice
					status={notice.status}
					isDismissible={true}
					onRemove={() => setNotice(null)}
					className="kh-dashboard-notice"
				>
					{notice.message}
				</Notice>
			)}

			<main className="kh-dashboard-main">{renderActiveTab()}</main>
		</div>
	);
}

domReady(() => {
	const rootElement = document.getElementById('kinetichub-dashboard-root');

	if (!rootElement) {
		return;
	}

	createRoot(rootElement).render(<Dashboard />);
});