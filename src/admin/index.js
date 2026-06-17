/**
 * kinetichub Suite - Admin Dashboard React App
 * Version: 1.0.0
  (Strategic Freemium UX & Dynamic Badging)
 */

import './admin.scss';
import domReady from '@wordpress/dom-ready';
import { createRoot, useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import {
    TabPanel,
    PanelBody,
    PanelRow,
    Placeholder,
    Button,
    ToggleControl,
    RangeControl,
    ColorPalette,
    SelectControl,
    Notice,
    Spinner
} from '@wordpress/components';
import { starEmpty, layout, cog, shield } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

if ( typeof  !== 'undefined' ) {
    apiFetch.use( apiFetch.createRootURLMiddleware( .restUrl ) );
    apiFetch.use( apiFetch.createNonceMiddleware( .nonce ) );
}

const Dashboard = () => {
    const [ settings, setSettings ] = useState({
        globalLerp: 0.08,
        accentColor: '#10b981',
        enableMobileMotion: true,
        performanceMode: 'balanced',
        assetOptimization: true,
        glassIntensity: 20,
        activeBlocks: {}
    });

    const [ isLoaded, setIsLoaded ] = useState(false);
    const [ isSaving, setIsSaving ] = useState(false);
    const [ activeTab, setActiveTab ] = useState('overview');
    const [ showNotice, setShowNotice ] = useState(false);
    const [ saveError, setSaveError ] = useState(null);

    const [ webGLSupport, setWebGLSupport ] = useState(false);
    const [ restApiStatus, setRestApiStatus ] = useState(__('Checking...', 'kinetichub'));
    const [ restApiOnline, setRestApiOnline ] = useState(false);

    useEffect(() => {
        try {
            const canvas = document.createElement('canvas');
            setWebGLSupport(!!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))));
        } catch (e) {
            setWebGLSupport(false);
        }

        apiFetch({ path: '/kinetichub/v1/settings' }).then((response) => {
            if (response && Object.keys(response).length > 0) {
                setSettings(prev => ({
                    ...prev,
                    ...response,
                    activeBlocks: response.activeBlocks || {}
                }));
            }
            setIsLoaded(true);
            setRestApiStatus(__('Online', 'kinetichub'));
            setRestApiOnline(true);
        }).catch(() => {
            setIsLoaded(true);
            setRestApiStatus(__('Offline/Error', 'kinetichub'));
            setRestApiOnline(false);
        });
    }, []);

    const saveGlobalSettings = () => {
        setIsSaving(true);
        setSaveError(null);
        apiFetch({
            path: '/kinetichub/v1/settings',
            method: 'POST',
            data: settings,
        }).then(() => {
            setIsSaving(false);
            setSaveError(null);
            setShowNotice(true);
            setTimeout(() => setShowNotice(false), 3000);
        }).catch((err) => {
            setIsSaving(false);
            setSaveError(err.message || __('Failed to save settings. Please try again.', 'kinetichub'));
            console.error('Failed to save settings', err);
        });
    };

    const pluginBaseUrl = typeof  !== 'undefined' ? .pluginUrl : '';
    const isProActive = typeof  !== 'undefined' ? . : false;

    // Complete list of installed Kinetic blocks
    const blocksList = [
        { id: 'kinetic-box', name: __('Kinetic Box', 'kinetichub'), icon: 'dashicons-move', image: pluginBaseUrl + 'assets/images/Kinetic-box.jpg' },
        { id: 'kinetic-typography', name: __('Kinetic Typography', 'kinetichub'), icon: 'dashicons-editor-textcolor', image: pluginBaseUrl + 'assets/images/Kinetic-typo.jpg' },
        { id: 'kinetic-magnetic-button', name: __('Magnetic Button', 'kinetichub'), icon: 'dashicons-touch', image: pluginBaseUrl + 'assets/images/Kinetic-button.jpg' },
        { id: 'kinetic-marquee', name: __('Kinetic Marquee', 'kinetichub'), icon: 'dashicons-move', image: pluginBaseUrl + 'assets/images/Kinetic-marquee.jpg' },
        { id: 'kinetic-scroll-divider', name: __('Scroll Divider', 'kinetichub'), icon: 'dashicons-minus', image: pluginBaseUrl + 'assets/images/Kinetic-divider.jpg' },
        { id: 'kinetic-video-modal', name: __('Video Modal', 'kinetichub'), icon: 'dashicons-controls-play', image: pluginBaseUrl + 'assets/images/Kinetic-video.jpg' },
        { id: 'kinetic-hero-mesh', name: __('Liquid Mesh', 'kinetichub'), icon: 'dashicons-admin-site-alt3', image: pluginBaseUrl + 'assets/images/Kinetic-mesh.jpg' },
        { id: 'kinetic-before-after', name: __('Before/After Slider', 'kinetichub'), icon: 'dashicons-images-alt2', image: pluginBaseUrl + 'assets/images/Kinetic-before.jpg' },
        { id: 'kinetic-audio-player', name: __('Audio Player', 'kinetichub'), icon: 'dashicons-media-audio', image: pluginBaseUrl + 'assets/images/Kinetic-audio.jpg' },
        { id: 'kinetic-split-scroll', name: __('Split Scroll', 'kinetichub'), icon: 'dashicons-columns', image: pluginBaseUrl + 'assets/images/Kinetic-split.jpg' },
        { id: 'kinetic-cursor-reveal', name: __('Cursor Reveal', 'kinetichub'), icon: 'dashicons-cursor', image: pluginBaseUrl + 'assets/images/Kinetic-cursor.jpg' },
        { id: 'kinetic-ambient-aura', name: __('Ambient Aura', 'kinetichub'), icon: 'dashicons-lightbulb', image: pluginBaseUrl + 'assets/images/Kinetic-aura.jpg' },
    ];

    const toggleBlock = (blockId, isChecked) => {
        setSettings(prev => ({
            ...prev,
            activeBlocks: {
                ...prev.activeBlocks,
                [blockId]: isChecked
            }
        }));
    };

    const activeBlocksCount = blocksList.filter(b => settings.activeBlocks[b.id] !== false).length;
    const realBlocksTotal = blocksList.length;

    const tabs = [
        { name: 'overview', title: __('Overview', 'kinetichub'), icon: starEmpty },
        { name: 'blocks', title: __('My Suite', 'kinetichub'), icon: layout },
        { name: 'settings', title: __('Global Settings', 'kinetichub'), icon: cog },
        { name: 'license', title: __('License & System', 'kinetichub'), icon: shield },
    ];

    if (!isLoaded) {
        return (
            <div className="kh-dashboard-wrapper">
                <div className="kh-loader"><Spinner /></div>
            </div>
        );
    }

    const renderTabContent = ( tab ) => {
        if ( tab.name === 'overview' ) {
            return (
                <div className="kh-content-area">
                    <div className="kh-settings-grid">
                        <div className="kh-col">
                            <PanelBody title={__('🚀 Performance Engine', 'kinetichub')} initialOpen={ true }>
                                <PanelRow>
                                    <div>{__('Active Kinetic Modules', 'kinetichub')}</div>
                                    <div className="kh-badge-status">{activeBlocksCount} / {realBlocksTotal} {__('Loaded', 'kinetichub')}</div>
                                </PanelRow>
                                <PanelRow>
                                    <div>{__('JS Physics Engine', 'kinetichub')}</div>
                                    <div className="kh-badge-status">v1.0.0 Stable</div>
                                </PanelRow>
                                <PanelRow>
                                    <div>{__('License Status', 'kinetichub')}</div>
                                    <div className="kh-badge-status" style={{ color: isProActive ? '#10b981' : '#94a3b8' }}>
                                        {isProActive ? 'advanced Active' : 'License Not Connected'}
                                    </div>
                                </PanelRow>
                            </PanelBody>
                            <Placeholder icon={ layout } label={__('Welcome to KineticHub', 'kinetichub')} instructions={__('The most advanced motion suite for Gutenberg. Start building with fluid physics today.', 'kinetichub')}>
                                <Button variant="primary" isLarge href="https://docs.getkinetichub.com" target="_blank">
                                    {__('View Documentation', 'kinetichub')}
                                </Button>
                            </Placeholder>
                        </div>
                        <div className="kh-col">
                            <PanelBody title={__('Quick Status', 'kinetichub')}>
                                <p style={{fontSize: '13px', color: '#64748b', lineHeight: '1.8'}}>
                                    <strong>{__('WebGL Physics:', 'kinetichub')}</strong> {webGLSupport ? <span style={{color: '#10b981'}}>{__('Supported', 'kinetichub')}</span> : <span style={{color: '#ef4444'}}>{__('Not Supported', 'kinetichub')}</span>}<br/>
                                    <strong>{__('Global Motion:', 'kinetichub')}</strong> {settings.enableMobileMotion ? __('Desktop & Mobile', 'kinetichub') : __('Desktop Only', 'kinetichub')}<br/>
                                    <strong>{__('Engine Mode:', 'kinetichub')}</strong> <span style={{textTransform: 'capitalize'}}>{settings.performanceMode}</span>
                                </p>
                            </PanelBody>
                        </div>
                    </div>
                </div>
            );
        }

        if ( tab.name === 'blocks' ) {
            return (
                <div className="kh-content-area">
                    <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 10px 0' }}>{__('Kinetic Suite', 'kinetichub')}</h2>
                            <p style={{ color: '#64748b', fontSize: '16px' }}>{__('Toggle components on or off to optimize your website\'s performance.', 'kinetichub')}</p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={saveGlobalSettings}
                            isBusy={isSaving}
                            disabled={isSaving}
                            style={{ height: '45px', padding: '0 30px', borderRadius: '8px', backgroundColor: settings.accentColor }}
                        >
                            {__('Save Suite Configuration', 'kinetichub')}
                        </Button>
                    </div>

                    {showNotice && <Notice status="success" onRemove={() => setShowNotice(false)}>{__('All changes saved!', 'kinetichub')}</Notice>}
                    {saveError && <Notice status="error" onRemove={() => setSaveError(null)}>{saveError}</Notice>}

                    {!isProActive && (
                        <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '25px', borderRadius: '12px', marginBottom: '30px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                            <div style={{ maxWidth: '70%' }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="dashicons dashicons-yes-alt"></span> {__('KineticHub advanced is installed', 'kinetichub')}
                                </h4>
                                <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}>
                                    {__('Your advanced license includes one year of updates and support. Activate your license key to connect this site to your KineticHub account. After the license period ends, your installed advanced blocks remain available, but updates and support require renewal.', 'kinetichub')}
                                </p>
                            </div>
                            <Button variant="primary" onClick={() => setActiveTab('license')} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', padding: '0 25px', height: '45px', borderRadius: '8px', fontWeight: 'bold' }}>
                                {__('Manage License', 'kinetichub')}
                            </Button>
                        </div>
                    )}

                    <div className="kh-blocks-grid">
                        {blocksList.map((block) => {
                            const isActive = settings.activeBlocks[block.id] !== false;

                            return (
                                <div key={block.id} className="kh-block-card" style={{ transition: 'all 0.3s ease' }}>

                                    <div className="kh-pro-badge" style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff'}}>advanced</div>

                                    <div
                                        className="kh-card-image"
                                        style={ block.image ? { backgroundImage: `url('${block.image}')` } : {} }
                                    >
                                        { !block.image && <span className={`dashicons ${block.icon}`}></span> }
                                    </div>
                                    <div className="kh-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 25px' }}>
                                        <div>
                                            <h4 style={{margin: '0 0 5px 0', fontSize: '16px'}}>{block.name}</h4>

                                            <span style={{fontSize:'12px', color: isActive ? '#10b981' : '#94a3b8', fontWeight: 'bold'}}>{isActive ? __('Active', 'kinetichub') : __('Inactive', 'kinetichub')}</span>
                                        </div>

                                        <ToggleControl
                                            checked={isActive}
                                            onChange={(val) => toggleBlock(block.id, val)}
                                            __nextHasNoMarginBottom={true}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        if ( tab.name === 'settings' ) {
            return (
                <div className="kh-content-area">
                    <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 10px 0' }}>{__('Global Settings', 'kinetichub')}</h2>
                            <p style={{ color: '#64748b', fontSize: '16px' }}>{__('Universal controls for all Kinetic Hub components.', 'kinetichub')}</p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={saveGlobalSettings}
                            isBusy={isSaving}
                            disabled={isSaving}
                            style={{ height: '45px', padding: '0 30px', borderRadius: '8px', backgroundColor: settings.accentColor }}
                        >
                            {__('Save All Changes', 'kinetichub')}
                        </Button>
                    </div>

                    {showNotice && <Notice status="success" onRemove={() => setShowNotice(false)}>{__('All changes saved!', 'kinetichub')}</Notice>}
                    {saveError && <Notice status="error" onRemove={() => setSaveError(null)}>{saveError}</Notice>}

                    <div className="kh-settings-grid">
                        <div className="kh-col">
                            <PanelBody title={__('🕹️ Universal Motion Physics', 'kinetichub')} initialOpen={true}>
                                <RangeControl
                                    label={__('Global Lerp (Smoothness)', 'kinetichub')}
                                    help={__('Adjusts the tracking delay for all magnetic and reveal blocks. Lower value = smoother/slower.', 'kinetichub')}
                                    value={settings.globalLerp}
                                    onChange={(v) => setSettings({...settings, globalLerp: v})}
                                    min={0.01} max={0.2} step={0.01}
                                    __nextHasNoMarginBottom={true}
                                />
                                <div style={{ marginTop: '25px' }}>
                                    <ToggleControl
                                        label={__('Enable Motion on Mobile', 'kinetichub')}
                                        help={__('Disabling this improves battery life on devices below 768px width.', 'kinetichub')}
                                        checked={settings.enableMobileMotion}
                                        onChange={(v) => setSettings({...settings, enableMobileMotion: v})}
                                        __nextHasNoMarginBottom={true}
                                    />
                                </div>
                            </PanelBody>

                            <PanelBody title={__('🎨 Global Design System', 'kinetichub')} initialOpen={true}>
                                <p style={{marginBottom: '10px'}}>{__('Primary Brand Color', 'kinetichub')}</p>
                                <ColorPalette
                                    value={settings.accentColor}
                                    onChange={(v) => setSettings({...settings, accentColor: v || '#10b981'})}
                                />
                                <hr style={{margin: '25px 0', border: '0', borderTop: '1px solid #eee'}} />
                                <RangeControl
                                    label={__('Glassmorphism Intensity (Blur)', 'kinetichub')}
                                    value={settings.glassIntensity}
                                    onChange={(v) => setSettings({...settings, glassIntensity: v})}
                                    min={0} max={50}
                                    __nextHasNoMarginBottom={true}
                                />
                            </PanelBody>
                        </div>

                        <div className="kh-col">
                            <PanelBody title={__('⚡ Performance & Assets', 'kinetichub')} initialOpen={true}>
                                <SelectControl
                                    label={__('Engine Rendering Mode', 'kinetichub')}
                                    value={settings.performanceMode}
                                    options={[
                                        { label: __('High Performance (4K/144Hz)', 'kinetichub'), value: 'performance' },
                                        {label: __('Balanced (60fps Standard)', 'kinetichub'), value: 'balanced'},
                                        {label: __('Eco Mode (Battery Saver)', 'kinetichub'), value: 'eco'}
                                    ]}
                                    onChange={(v) => setSettings({...settings, performanceMode: v})}
                                    __nextHasNoMarginBottom={true}
                                />
                                <div style={{ marginTop: '25px' }}>
                                    <ToggleControl
                                        label={__('Load CSS in <head> (Recommended)', 'kinetichub')}
                                        help={__('Prevents layout shifts (FOUC). Disable to load in footer for strict raw speed.', 'kinetichub')}
                                        checked={settings.assetOptimization}
                                        onChange={(v) => setSettings({...settings, assetOptimization: v})}
                                        __nextHasNoMarginBottom={true}
                                    />
                                </div>
                            </PanelBody>
                        </div>
                    </div>
                </div>
            );
        }

        if ( tab.name === 'license' ) {
            return (
                <div className="kh-content-area">
                    <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 10px 0' }}>{__('License & System', 'kinetichub')}</h2>
                            <p style={{ color: '#64748b', fontSize: '16px' }}>{__('Manage your Pro license and check server environment health.', 'kinetichub')}</p>
                        </div>
                    </div>

                    <div className="kh-settings-grid">
                        <div className="kh-col">
                            <PanelBody title={__('🔑 Software License', 'kinetichub')} initialOpen={true}>
                                <div style={{ padding: '10px 0' }}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                                        {isProActive ? __('advanced License Active', 'kinetichub') : __('License Not Connected', 'kinetichub')}
                                    </h4>
                                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
                                        {__('License activation, subscription management, and billing are securely handled by our unified engine. Click below to access your portal.', 'kinetichub')}
                                    </p>
                                    {/* TODO: If a  account/license URL helper becomes available in PHP, localize it to  (e.g. accountUrl/licenseUrl) and use it here instead of the static admin.php link. */}
                                    <Button variant="primary" href="admin.php?page=kinetichub-account" style={{ height: '40px', padding: '0 20px', borderRadius: '6px', backgroundColor: settings.accentColor }}>
                                        {isProActive ? __('Manage Account', 'kinetichub') : __('Activate License', 'kinetichub')}
                                    </Button>
                                </div>
                            </PanelBody>
                        </div>
                        <div className="kh-col">
                            <PanelBody title={__('🖥️ Server Diagnostics', 'kinetichub')} initialOpen={true}>
                                <table style={{width: '100%', textAlign: 'left', fontSize: '13px'}}>
                                    <tbody>
                                        <tr>
                                            <td style={{padding: '12px 0', borderBottom: '1px solid #f1f5f9'}}>{__('REST API', 'kinetichub')}</td>
                                            <td style={{padding: '12px 0', borderBottom: '1px solid #f1f5f9', color: restApiOnline ? '#10b981' : '#ef4444', fontWeight: 'bold'}}>{restApiStatus}</td>
                                        </tr>
                                        <tr>
                                            <td style={{padding: '12px 0', borderBottom: '1px solid #f1f5f9'}}>{__('WebGL Engine', 'kinetichub')}</td>
                                            <td style={{padding: '12px 0', borderBottom: '1px solid #f1f5f9', color: webGLSupport ? '#10b981' : '#ef4444', fontWeight: 'bold'}}>{webGLSupport ? __('Active', 'kinetichub') : __('Missing', 'kinetichub')}</td>
                                        </tr>
                                        <tr>
                                            <td style={{padding: '12px 0'}}>{__('WP Compatibility', 'kinetichub')}</td>
                                            <td style={{padding: '12px 0', fontWeight: 'bold', color: '#64748b'}}>{__('Requires 6.2+', 'kinetichub')}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </PanelBody>
                        </div>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="kh-dashboard-wrapper" style={{ '--kh-accent': settings.accentColor }}>
            <header className="kh-dashboard-header">
                <div className="kh-logo">
                    <span className="dashicons dashicons-superhero" style={{fontSize: '30px', width: '30px', height: '30px'}}></span>
                    <h1>KineticHub <span>{__('Master Control', 'kinetichub')}</span></h1>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <span style={{opacity:0.6, fontSize:'12px'}}>{__('Suite v', 'kinetichub')}{typeof  !== 'undefined' && .version ? .version : '1.0.0'}</span>
                </div>
            </header>
            <TabPanel key={activeTab} className="kh-main-tabs" activeClass="is-active" tabs={ tabs } initialTabName={ activeTab } onSelect={ ( tabName ) => setActiveTab( tabName ) }>
                { ( tab ) => renderTabContent( tab ) }
            </TabPanel>
        </div>
    );
};

domReady( () => {
    const rootElement = document.getElementById( 'kinetichub-dashboard-root' );
    if ( rootElement ) {
        createRoot( rootElement ).render( <Dashboard /> );
    }
} );