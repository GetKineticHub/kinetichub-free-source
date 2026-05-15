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

kinetichub is a lightweight suite of animated blocks designed for designers, agencies, and developers who want to bring motion and interaction to WordPress websites.

The plugin provides a collection of modern UI blocks such as an interactive audio player, before/after image comparison slider, magnetic buttons, animated typography, cursor reveal effects, and generative hero backgrounds.

All animations are powered by a lightweight motion system using efficient JavaScript interpolation techniques.

kinetichub is designed with performance, accessibility, and modern WordPress standards in mind.

= Included Blocks (12 Blocks) =

* Kinetic Ambient Aura – Generative background glows and ambient lighting effects.
* Kinetic Audio Player – Custom styled audio player with waveform display and accessible controls.
* Kinetic Before/After – Interactive image comparison slider with physics-based dragging.
* Kinetic Box – Advanced container with 3D tilt physics and dynamic lighting.
* Kinetic Cursor Reveal – Custom cursor tracking and interactive media reveal on hover.
* Kinetic Hero Mesh – Interactive 3D webGL mesh background for hero sections.
* Kinetic Magnetic Button – Call-to-action button that pulls towards the user's cursor.
* Kinetic Marquee – Infinite scrolling text and media bands with scroll-velocity detection.
* Kinetic Scroll Divider – Animated SVG line dividers that draw themselves based on scroll position.
* Kinetic Split Scroll – Dual-column layout where content pins and snaps beautifully as you scroll.
* Kinetic Typography – Text reveal animations (lines, words, chars) with advanced staggered delays.
* Kinetic Video Modal – Safelisted video player with cinematic entrance animations.

= Performance Focused =

kinetichub is engineered to avoid unnecessary overhead.
* Block assets are loaded contextually, with lightweight global assets used for shared runtime behavior.
* Where supported, motion effects pause automatically when blocks leave the viewport.
* Designed to minimize layout recalculations and encourage smooth rendering.
* Designed to work well with modern performance optimization tools.

= Accessibility =

kinetichub respects the user's system-level accessibility preferences.
When a user enables prefers-reduced-motion in their operating system, motion-heavy animations automatically reduce or disable to provide a more comfortable browsing experience.

= Update to advanced =

kinetichub advanced unlocks advanced motion engines and extended customization options including:

* Advanced motion backgrounds (including WebGL-based effects)
* Sticky and floating interaction physics
* Additional animation styles
* Extended design controls
* Advanced support

More information is available at:
https://getkinetichub.com

== Source Code & Development ==

In compliance with WordPress.org guidelines, the non-minified source code, build scripts, and webpack configurations used to generate this plugin are publicly available.
GitHub Repository: https://github.com/GetKineticHub/kinetichub

== Installation ==

1. Upload the kinetichub folder to the /wp-content/plugins/ directory, or install the ZIP file via the WordPress Plugins screen.
2. Activate the plugin through the Plugins menu in WordPress.
3. Open the Gutenberg editor and search for Kinetic to start inserting blocks.
4. (Optional) Configure global settings from the kinetichub Dashboard in the WordPress admin menu.

== Screenshots ==

1. Kinetic Audio Player block with custom styled playback controls
2. Before / After image comparison slider interaction
3. Animated hero background using Kinetic Hero Mesh
4. Magnetic button interaction with cursor physics
5. Animated typography reveal effects
6. Cursor reveal portfolio list interaction
7. Infinite scrolling marquee text block
8. Split scroll layout with synchronized media panels

== External Services & Privacy ==

This plugin integrates with the  SDK to provide optional licensing, upgrades, and usage insights for users who choose to opt in.

=  API Connection =

 may connect to its external API endpoints in order to:

* Verify license keys for the Pro version
* Deliver plugin updates for licensed users
* Collect optional, anonymized usage statistics (only after explicit user consent)

These requests are made to the following service:

Service Provider: 
API Base URL: https://api.freemius.com/

= What data may be sent (only after opt-in) =

If the user chooses to opt in to the  telemetry program, the following information may be transmitted:

* Website URL
* WordPress version
* PHP version
* Plugin version
* Activated plugin modules or features

No personal data, content, or user accounts are transmitted.

= User Consent & Privacy =

The plugin does not send any data to  until the site administrator explicitly approves the opt-in screen presented during plugin activation.

Administrators can decline the opt-in and continue using the plugin without any telemetry or data transmission.

 Privacy Policy:
https://freemius.com/privacy/

== Frequently Asked Questions ==

= Do I need a advanced license to use this plugin? =

No. The free version includes all core blocks and foundational animations. A advanced license is optional and unlocks advanced motion engines and additional customization features.

= Will this plugin slow down my website? =

No. kinetichub loads block assets contextually, with lightweight global assets used for shared runtime behavior. Where supported, motion effects also pause when elements leave the viewport.

= Can I use multiple Kinetic blocks on the same page? =

Yes. The plugin is designed to support multiple blocks per page while maintaining stable performance.

== Changelog ==

= 1.0.0 =
* Initial stable release
* Added 12 interactive blocks
* Implemented unified motion engine
* Integrated kinetichub dashboard for global settings
* Performance optimizations, strong escaping and validation practices, and accessibility support