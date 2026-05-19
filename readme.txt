=== kinetichub ===
Contributors: kinetichub
Tags: animation blocks, interactive blocks, scroll animations, ui effects, gutenberg blocks
Requires at least: 6.2
Tested up to: 6.9
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Animated Gutenberg blocks for motion, video, audio, typography, sliders, marquees, buttons, and visual UI effects.

== Description ==

kinetichub is a lightweight suite of animated Gutenberg blocks for designers, agencies, and site builders who want to add motion and interactive UI effects to WordPress pages.

The plugin includes a collection of visual blocks for animated typography, video modals, audio players, before/after image comparisons, marquees, interactive buttons, hero backgrounds, scroll dividers, split scroll layouts, cursor reveal lists, ambient visuals, and motion-ready containers.

kinetichub focuses on stable block functionality, contextual asset loading, accessibility, reduced-motion handling, and WordPress-native editing workflows.

= Included Blocks =

* Kinetic Ambient Aura â€“ Soft ambient visual background effects.
* Kinetic Audio Player â€“ Custom audio playback block with accessible controls.
* Kinetic Before/After â€“ Interactive image comparison slider.
* Kinetic Box â€“ Motion-ready container block for structured content.
* Kinetic Cursor Reveal â€“ Interactive media reveal list.
* Kinetic Hero Mesh â€“ Visual hero background block.
* Kinetic Magnetic Button â€“ Custom call-to-action button with animated styling.
* Kinetic Marquee â€“ Auto-scrolling media and logo marquee.
* Kinetic Scroll Divider â€“ Animated scroll-triggered divider line.
* Kinetic Split Scroll â€“ Split layout with pinned media and scrolling content.
* Kinetic Typography â€“ Animated text reveal block with server-rendered text splitting.
* Kinetic Video Modal â€“ Lazy video modal and inline playback block.

= Performance Focused =

kinetichub is designed to avoid unnecessary page weight.

* Block assets are loaded through WordPress block asset registration.
* Shared runtime behavior is handled by lightweight frontend assets.
* Video embeds are initialized lazily after user interaction.
* Motion-heavy effects respect reduced-motion preferences.
* Global motion settings can be configured from the dashboard.

= Accessibility =

kinetichub includes accessibility-oriented behavior across supported blocks.

* Reduced-motion support.
* Keyboard focus handling where interactive controls are used.
* Screen-reader friendly fallback text for animated typography.
* ARIA labels for video modal controls.
* Semantic output and escaped server-side rendering.

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

== Source Code ==

This plugin includes compiled JavaScript and CSS generated with npm and WordPress build tools.

The human-readable source files used to build the distributed assets are included directly in this plugin package in the following directory:

`source/`

The source directory includes the uncompiled free-version source files, package.json, webpack configuration, and build instructions for the JavaScript and CSS assets included in the distributed build directory.

The same human-readable free-version source is also publicly available here:

https://github.com/GetKineticHub/kinetichub-free-source/tree/wporg-free-source-1.0.0

= Build Instructions =

The plugin uses the standard WordPress block build pipeline based on @wordpress/scripts.

To rebuild the distributed assets from the included source files:

1. Open a terminal.
2. Go to the included source directory:
   `cd source`

3. Install build dependencies:
   `npm install`

4. Generate production assets:
   `npm run build`

The build process compiles source files from the source/src directory into a build directory using the included webpack configuration.

= Build Requirements =

* Node.js 18 or later
* npm 9 or later

== Installation ==

1. Upload the kinetichub folder to the /wp-content/plugins/ directory, or install the ZIP file from the WordPress Plugins screen.
2. Activate the plugin through the Plugins menu in WordPress.
3. Open the block editor and search for "Kinetic".
4. Open the kinetichub dashboard from the WordPress admin menu to configure global settings.

== Frequently Asked Questions ==

= Does the plugin connect to external services on activation? =

No. The plugin does not connect to external services on activation.

= When are YouTube or Vimeo loaded? =

YouTube or Vimeo content is loaded only when a site administrator adds a supported video URL to a video block and a visitor interacts with or views that configured video experience.

= Can I use self-hosted media? =

Yes. Supported blocks can use media files uploaded to the WordPress Media Library or direct self-hosted media file URLs.

= Will this plugin slow down my website? =

The plugin is designed to load assets through WordPress block registration and to keep runtime behavior lightweight. Actual performance depends on the number of blocks used on a page, uploaded media size, theme structure, hosting, and caching.

= Can I disable blocks I do not use? =

Yes. Open the kinetichub dashboard and disable blocks from the included suite as needed.

= Does the plugin support reduced motion? =

Yes. Motion-heavy behavior is reduced or disabled when the visitor has enabled reduced-motion preferences at the operating system level.

= Can I use multiple kinetichub blocks on one page? =

Yes. The plugin is designed to support multiple blocks on the same page.

== Screenshots ==

1. Dashboard overview for included animated blocks.
2. Kinetic Typography block with text reveal animation.
3. Kinetic Video Modal block with cover image and play button.
4. Kinetic Before/After comparison slider.
5. Kinetic Marquee media strip.
6. Kinetic Hero Mesh visual background.
7. Kinetic Audio Player block.
8. Kinetic Split Scroll layout.

== Changelog ==

= 1.0.0 =
* Initial stable release.
* Added 12 animated Gutenberg blocks.
* Added kinetichub dashboard for included block management and global settings.
* Added reduced-motion handling for motion-heavy behavior.
* Added contextual block asset loading.
* Added server-side validation and escaped output for dynamic blocks.
* Added accessibility improvements across interactive blocks.
