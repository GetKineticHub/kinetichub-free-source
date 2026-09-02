=== KineticHub - Animated Blocks ===
Contributors: kinetichub
Tags: blocks, animation, gutenberg, interactive, motion
Requires at least: 6.2
Tested up to: 7.1
Stable tag: 1.1.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Animated Gutenberg blocks for motion, media, typography, buttons, marquees, dividers, and interactive page sections.

== Description ==

KineticHub is a lightweight suite of animated Gutenberg blocks for designers, agencies, developers, and site builders who want to add motion, media, and interactive UI effects to WordPress pages without leaving the block editor.

The plugin includes visual blocks for animated typography, video modals, audio players, before-and-after image comparisons, marquees, interactive buttons, hero backgrounds, scroll dividers, split scroll layouts, cursor reveal lists, ambient visuals, and motion-ready containers.

KineticHub is designed for modern WordPress workflows. Blocks can be inserted, configured, and reused directly inside the editor, while frontend assets are loaded through WordPress block asset registration.

Use KineticHub to build:

* Animated landing page sections
* Portfolio and agency pages
* Interactive hero areas
* Product and service highlights
* Editorial layouts with motion
* Media-rich Gutenberg pages
* Lightweight visual effects without a page builder dependency

View demos and documentation at:
https://getkinetichub.com

KineticHub includes 13 Gutenberg blocks. The full block list is available in the Blocks section below.

= Performance Focused =

KineticHub is designed to avoid unnecessary page weight and unnecessary frontend execution.

* Block assets are loaded through WordPress block asset registration.
* Shared runtime behavior is handled by lightweight frontend assets.
* Video embeds are initialized lazily after user interaction where supported by the block setup.
* Motion-heavy effects respect reduced-motion preferences.
* Global motion settings can be configured from the KineticHub dashboard.
* Blocks are designed to work with modern WordPress themes and performance optimization tools.

= Accessibility =

KineticHub includes accessibility-oriented behavior across supported blocks.

* Reduced-motion support for users who prefer less animation.
* Keyboard focus handling where interactive controls are used.
* Screen-reader friendly fallback text for animated typography.
* ARIA labels for video modal controls.
* Semantic output and escaped server-side rendering.
* Interactive blocks are designed to remain usable without relying only on motion.

= External Services =

The plugin does not connect to external services on activation.

Some blocks may load third-party media only when a site administrator configures content that uses those providers. For example, the Kinetic Video Modal block can embed videos from YouTube or Vimeo when a YouTube or Vimeo URL is entered by the site administrator.

Third-party services may receive visitor data when embedded media is loaded by the browser. This depends on the configured media URL, the provider used, and the visitor's browser behavior.

Supported optional video providers include:

* YouTube
* YouTube NoCookie
* Vimeo

Self-hosted media files can also be used.

Provider endpoints that may be used when configured by the site administrator:

* YouTube video embeds: https://www.youtube.com/
* YouTube privacy-enhanced embeds: https://www.youtube-nocookie.com/
* YouTube thumbnail images: https://img.youtube.com/
* Vimeo video embeds: https://player.vimeo.com/

Provider policies:

* YouTube Terms of Service: https://www.youtube.com/t/terms
* YouTube Privacy Policy: https://policies.google.com/privacy
* Vimeo Terms of Service: https://vimeo.com/terms
* Vimeo Privacy Policy: https://vimeo.com/privacy

== Installation ==

1. Install KineticHub from the WordPress plugin directory, or upload the plugin folder to the `/wp-content/plugins/` directory.
2. Activate the plugin through the Plugins screen in WordPress.
3. Open the block editor and search for "Kinetic" to insert a KineticHub block.
4. Use the KineticHub dashboard in the WordPress admin area to configure global settings and block availability.

== Frequently Asked Questions ==

= Does KineticHub work with the block editor? =

Yes. KineticHub is built for the WordPress block editor. The included blocks can be inserted and configured directly in Gutenberg.

= Does KineticHub require a page builder? =

No. KineticHub works directly with the WordPress block editor and does not require a separate page builder.

= Does the plugin connect to external services on activation? =

No. KineticHub does not connect to external services on activation.

= When are YouTube or Vimeo loaded? =

YouTube or Vimeo may be loaded only when a site administrator configures a block with a YouTube or Vimeo URL. Loading behavior depends on the configured block, the selected provider, and the visitor's browser behavior.

= Can I use self-hosted media? =

Yes. Supported media blocks can use self-hosted media files where applicable.

= Will this plugin slow down my website? =

KineticHub is designed to load block assets through WordPress block asset registration and to avoid unnecessary frontend overhead. Actual performance depends on the number of blocks used, page design, media size, hosting, theme, and other active plugins.

= Can I disable blocks I do not use? =

Yes. The KineticHub dashboard includes block management controls so site administrators can manage available blocks.

= Does KineticHub support reduced motion? =

Yes. Motion-heavy effects respect reduced-motion preferences to provide a more comfortable experience for users who prefer less animation.

= Can I use multiple KineticHub blocks on one page? =

Yes. KineticHub is designed to support multiple blocks on the same page. For best performance, use optimized media and avoid overloading a single page with too many heavy visual effects.

= Where can I see demos? =

Demos and documentation are available at:
https://getkinetichub.com

== Screenshots ==

1. Kinetic Box block used as a motion-ready content container.
2. Kinetic Typography block with animated text effects.
3. Kinetic Hero Mesh block with animated mesh visuals.
4. Kinetic Before/After block with interactive image comparison slider.
5. Kinetic Hero Mesh block in an alternate hero presentation.
6. Kinetic Cursor Reveal block with floating media preview behavior.
7. Kinetic Split Scroll layout with pinned media and scrolling content.
8. Kinetic Ambient Aura block used as a soft animated background effect.
9. Kinetic Video Modal block.
10. Kinetic Video Modal block.
11. Kinetic Audio Player block with custom playback controls.
12. Kinetic Magnetic Button block with interactive call-to-action styling.
13. Kinetic Scroll Progress block with visual page-progress indicators.

== Source Code ==

This plugin includes compiled JavaScript and CSS generated with npm and WordPress build tools.

The human-readable free-version source files used to build the distributed assets are publicly available here:

https://github.com/GetKineticHub/kinetichub-free-source/tree/wporg-free-source-1.1.0

The public source branch includes the uncompiled free-version source files, package.json, webpack configuration, and build instructions for the JavaScript and CSS assets included in the distributed `build/` directory.

= Build Instructions =

The plugin uses the standard WordPress block build pipeline based on `@wordpress/scripts`.

To rebuild the distributed assets from the public source branch:

1. Clone the public source repository.
2. Check out the matching source branch:

`wporg-free-source-1.1.0`

3. Install build dependencies:

`npm install`

4. Generate production assets:

`npm run build`

The build process compiles source files from the source repository into a `build` directory using the included webpack configuration.

= Build Requirements =

* Node.js 18 or later
* npm 9 or later

== Changelog ==

= 1.1.0 =
* Added Kinetic Scroll Progress with horizontal and vertical progress indicators, heading milestones, responsive positioning, and label controls.
* Improved Marquee motion controls with persistent Pause/Resume behavior, keyboard handling, reduced-motion support, and more reliable motion state.
* Improved Split Scroll responsive behavior, indicators, RTL support, keyboard interaction, and reduced-motion handling.
* Improved Kinetic Typography animation lifecycle and off-screen performance.
* Standardized editor notices across KineticHub blocks through shared reusable handling.
* Improved cross-theme and responsive compatibility across Audio Player, Magnetic Button, Video Modal, Cursor Reveal, Before/After, Kinetic Box, and other affected blocks.
* Updated the KineticHub Free dashboard and block discovery experience for the 13-block collection.
= 1.0.14 =
* Improved Kinetic Box compatibility with nested fixed-position content by removing an unnecessary persistent 3D rendering context.
* Fixed Hero Mesh so valid markup from nested blocks, including SVG and canvas content, is preserved correctly.
* Fixed the Magnetic Button extended hover area intercepting clicks on the Gutenberg block appender.
* Improved Cursor Reveal viewport clamping so floating previews remain within the visible page area.
* Improved Scroll Divider and Magnetic Button lifecycle handling when blocks are dynamically removed and reinserted.
* Improved Kinetic Typography cleanup after entry animations complete.
* Improved block inserter descriptions so they accurately describe the features available in KineticHub Free.
* Added a usage-gated, permanently dismissible WordPress.org review request after the plugin has been used for a while.
* Improved uninstall cleanup so KineticHub-owned settings are removed correctly.

= 1.0.13 =
* Fixed: full-width Hero Mesh produced a horizontal scrollbar on themes defining root padding when placed outside a padded container.
* Fixed: full-width Kinetic Typography could overflow or misalign on themes defining root padding when placed outside a padded container; migrated to the same padding-aware full-width technique used by Hero Mesh.
* Fixed: Cursor Reveal's Wide and Full width alignment options had no visible effect due to missing CSS.
* Fixed: the floating hover preview could extend past the viewport edge and cause a horizontal scrollbar on full-width layouts.
* Fixed: Kinetic Typography's hover-triggered Plexus background effect could accumulate duplicate window resize listeners on repeated hover.
* Fixed: Hero Mesh's grain animation and Classic background mode did not fully respect the operating system's reduced-motion preference.

= 1.0.12 =
* Fixed a remaining Hero Mesh alignfull horizontal overflow that could add a small horizontal scrollbar on some Windows browsers, while preserving full-width behavior at the page root and contained behavior inside Kinetic Box and columns.

= 1.0.11 =
* Fixed Hero Mesh overflow when an alignfull Hero Mesh block is placed inside constrained containers such as Kinetic Box or columns, while preserving normal full-width behavior when used directly in the page.
* Improved Hero Mesh contained rendering by removing unnecessary isolation and keeping Gradient/Blobs motion proportional in smaller containers.
* Reduced Hero Mesh viewport cold-start margin to improve scroll/interaction smoothness near visibility thresholds.

= 1.0.10 =
* Fixed a Hero Mesh layout regression where the block could overflow constrained containers such as columns, groups, and demo cards.
* Softened the Hero Mesh Film Grain Noise effect so it is less visually aggressive by default.
* Kept full-width Hero Mesh behavior scoped to alignfull layouts.

= 1.0.9 =
* Fixed Hero Mesh canvas layout behavior to prevent layout shift and ensure block styles enqueue correctly.
* Added block asset metadata validation to prevent stale block asset versions and missing file references.
* Improved Typography accessibility by preserving readable screen-reader text without unsupported ARIA attributes.
* Fixed editor iframe stylesheet loading for global KineticHub variables and animation styles.
* Improved Split Scroll pagination dot touch targets and keyboard focus behavior.
* Added Magnetic Button editor warnings for low-contrast color choices and optional accessible color presets.

= 1.0.8 =
* Fixed Typography wrapping in narrow containers when using split text animations.
* Improved Typography spacing between split words and ampersand characters.
* Improved Typography SEO notice spacing in the editor.
* Restored Cursor Reveal mask animation behavior.
* Added list layout controls to Cursor Reveal.
* Fixed Magnetic Button hover scale conflicts with Float, Lift Up, and Scale Up effects.
* Fixed Kinetic Box grayscale-to-color hover transition behavior.
* Normalized upgrade messaging across block controls.
* Added a lightweight KineticHub Pro dashboard banner for the free plugin.

= 1.0.7 =
* Fixed Magnetic Button SVG icon scaling and added left, center, and right alignment.
* Restored useful Cursor Reveal controls in FREE, including responsive typography, subtitle styling, media sizing, reveal masks, hover filters, and a subtle relative hover scale.
* Balanced Scroll Divider vertical spacing.
* Added Split Scroll media reordering and restored compatibility with third-party nested blocks.
* Improved the Audio Player Extended layout on smaller screens.

= 1.0.6 =
* Fixed unexpected output during activation caused by UTF-8 BOM characters in the plugin bootstrap file.

= 1.0.5 =
* Improved Split Scroll mobile inline media layout when sticky media on mobile is disabled.
* Improved Split Scroll mobile media grouping so each media item stays with its related content section.
* Reduced large spacer gaps in Split Scroll mobile inline mode.

= 1.0.4 =
* Fixed Magnetic Button icon clipping and hover layer rendering issues.
* Fixed Kinetic Box nested block rendering by preserving valid child block markup such as canvas and SVG elements.
* Fixed Hero Mesh, Before/After Slider, and other visual child blocks when nested inside Kinetic Box.
* Fixed Split Scroll mobile media fallback when sticky media on mobile is disabled.
* Updated selected block preview images.

= 1.0.2 =
* Fixed a WordPress.org package bootstrap issue that could require a missing vendor dependency on activation.

= 1.0.1 =
* Updated the plugin display name for clearer branding in the WordPress Plugins screen.
* Improved the WordPress.org readme content and formatting.

= 1.0.0 =
* Initial stable release.
* Added 12 Gutenberg blocks.
* Added contextual block asset loading.
* Added reduced-motion handling for motion-heavy effects.
* Added KineticHub dashboard for global settings and block management.
* Added source files and build instructions for WordPress.org distribution.

