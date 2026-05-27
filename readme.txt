=== KineticHub – Animated Gutenberg Blocks ===
Contributors: kinetichub
Tags: blocks, animation, gutenberg, interactive, motion
Requires at least: 6.2
Tested up to: 7.0
Stable tag: 1.0.1
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

KineticHub includes 12 Gutenberg blocks. The full block list is available in the Blocks section below.

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

1. Kinetic Ambient Aura block used as a soft animated background effect.
2. Kinetic Audio Player block with custom playback controls.
3. Kinetic Before/After block with interactive image comparison slider.
4. Kinetic Box block used as a motion-ready content container.
5. Kinetic Cursor Reveal block with floating media preview behavior.
6. Kinetic Hero Mesh block used as an animated hero background.
7. Kinetic Magnetic Button block with interactive call-to-action styling.
8. Kinetic Marquee block for scrolling media, logos, or content rows.
9. Kinetic Scroll Divider block with animated scroll-triggered line effect.
10. Kinetic Split Scroll layout with pinned media and scrolling content.
11. Kinetic Typography block with text reveal animation.
12. Kinetic Video Modal block with cover image and play button.

== Source Code ==

This plugin includes compiled JavaScript and CSS generated with npm and WordPress build tools.

The human-readable source files used to build the distributed assets are included directly in this plugin package in the following directory:

`source/`

The source directory includes the uncompiled free-version source files, package.json, webpack configuration, and build instructions for the JavaScript and CSS assets included in the distributed `build/` directory.

The same human-readable free-version source is also publicly available here:

https://github.com/GetKineticHub/kinetichub-free-source/tree/wporg-free-source-1.0.1

= Build Instructions =

The plugin uses the standard WordPress block build pipeline based on `@wordpress/scripts`.

To rebuild the distributed assets from the included source files:

1. Open a terminal.
2. Go to the included source directory:

`cd source`

3. Install build dependencies:

`npm install`

4. Generate production assets:

`npm run build`

The build process compiles source files from the `source/src` directory into a `build` directory using the included webpack configuration.

= Build Requirements =

* Node.js 18 or later
* npm 9 or later

== Changelog ==

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