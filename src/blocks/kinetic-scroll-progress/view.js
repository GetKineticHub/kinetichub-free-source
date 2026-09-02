/**
 * Kinetic Scroll Progress - Frontend Runtime
 * Version: 1.0.2
 *
 * Whole-page progress engine with automatic heading milestones.
 *
 * Architecture:
 * - One shared manager owns every page-level resource. Adding a second block to
 *   the page adds a Map entry, not a second listener or a second frame loop.
 * - Scrolling is event driven: a passive scroll listener schedules at most one
 *   animation frame. The frame never reschedules itself, so an idle page does
 *   no work at all.
 * - All layout reads happen on the geometry path, never in the scroll frame.
 *   The frame works purely from cached numbers.
 * - Headings are discovered once per page for the widest level set, then each
 *   instance filters that shared result to its own configuration.
 *
 * Milestones here are automatic, display-only and decorative. Manual targeting,
 * navigation and every paid presentation are deliberately absent.
 */
(function () {
    'use strict';

    const BLOCK_SELECTOR = '.kh-sp-wrapper';
    const READY_CLASS = 'js-ready';
    const PROGRESS_VAR = '--kh-sp-progress';
    const MS_POS_VAR = '--kh-sp-ms-pos';

    const SYNC_DELAY_MS = 150;
    const RESIZE_DEBOUNCE_MS = 150;
    const MILESTONE_DEBOUNCE_MS = 120;

    /**
     * Where in the viewport a heading is considered "reached". Also the point
     * the marker is drawn at, so the fill arrives at a marker at the same
     * moment that milestone becomes current.
     */
    const ACTIVATION_RATIO = 0.35;

    const HEADING_SELECTOR = 'h2, h3';

    /**
     * The single responsive breakpoint, matching the stylesheet exactly.
     *
     * Density is the only thing it switches: the same discovered headings feed
     * both sides of it, so crossing it re-selects from the existing cache
     * instead of scanning again.
     */
    const MOBILE_QUERY = '(max-width: 768px)';

    /**
     * Regions whose headings are interface rather than page content.
     *
     * Kept semantic on purpose. A longer list of theme class names would drop
     * legitimate headings whenever a theme wraps content in an unfamiliar
     * container, which is the more damaging failure.
     */
    const EXCLUDE_SELECTOR = [
        'header',
        'footer',
        'nav',
        'aside',
        'template',
        'dialog',
        '[hidden]',
        '[aria-hidden="true"]',
        '[inert]',
        '.screen-reader-text',
        '.kh-sp-wrapper',
    ].join(', ');

    /* ----------------------------------------------------------------------
     * Header awareness
     * ------------------------------------------------------------------- */

    /*
     * Read only by the desktop layer in the stylesheet. Writing it on a phone is
     * harmless -- no rule a phone can reach mentions it -- so the runtime needs
     * no viewport state of its own.
     */
    const HEADER_VAR = '--kh-sp-header-inset';
    const HEADER_AWARE_CLASS = 'header-aware';
    const PLACED_CLASS = 'is-placed';

    /**
     * Mirrors the media query this block's OWN admin-bar rules use. Not core's
     * breakpoint, and deliberately so -- see readAdminBaseline().
     */
    const ADMIN_BAR_QUERY = '(min-width: 601px)';

    /**
     * Regions whose <header> is content rather than site chrome. An article
     * header, a section header and a card header all live inside one of these.
     */
    const HEADER_EXCLUDE_SELECTOR = 'main, article, aside, footer, .wp-block-post-content';

    /**
     * Ceiling on both what may be accepted as a header and what may be applied
     * as clearance. One ratio, one meaning: anything occupying more than half
     * the viewport is a hero, not chrome, and a detector that somehow got past
     * that still cannot push the indicator past the halfway line.
     */
    const HEADER_MAX_RATIO = 0.5;

    

    /**
     * element -> {
     *   last, milestonesEnabled, levels, max, levelsMobile, maxMobile,
     *   showLabels, list, signature, currentIndex
     * }
     */
    const instances = new Map();

    let pageController = null;
    let geometryObserver = null;
    let lifecycleObserver = null;

    let syncTimer = null;
    let resizeTimer = null;
    let milestoneTimer = null;
    let framePending = false;

    let maxScroll = 0;

    /**
     * Page-global header state. One resolution, one measurement and one
     * observation for the whole page however many indicators are on it; no
     * instance ever carries header geometry of its own.
     */
    let headerNeeded = false;
    let headerEl = null;
    let observedHeader = null;
    /** Document-relative, so the scroll term is a subtraction. */
    let headerDocBottom = 0;
    /** Viewport-relative floor for a fixed or stuck header; 0 in normal flow. */
    let headerPinnedBottom = 0;
    let adminBaseline = 0;
    let maxHeaderInset = 0;
    /** -1 so the first pass always writes, including a legitimate 0. */
    let headerInsetLast = -1;
    let headerFramePending = false;

    /** Shared, DOM-ordered heading entries for the widest level set. */
    let sharedHeadings = [];

    

    /**
     * Which density configuration the current viewport asks for. Resolved once
     * per milestone refresh and read from there, so no width is ever queried
     * inside the scroll frame.
     */
    let isMobileViewport = false;

    /* ----------------------------------------------------------------------
     * Document geometry
     * ------------------------------------------------------------------- */

    /**
     * Maximum scrollable distance for the document.
     *
     * Themes disagree about which element actually reports the full page
     * height: some grow documentElement, some only grow body, and a theme that
     * sets height:100% on either one keeps that box at viewport height while
     * the real content overflows. Taking the largest reported height is the
     * behavior that survives all three.
     *
     * This reads layout, so it is only ever called outside the scroll frame.
     *
     * @return {number} Scrollable distance in pixels, never negative.
     */
    const readMaxScroll = () => {
        const doc = document.documentElement;
        const body = document.body;

        const documentHeight = Math.max(
            doc ? doc.scrollHeight : 0,
            doc ? doc.offsetHeight : 0,
            doc ? doc.clientHeight : 0,
            body ? body.scrollHeight : 0,
            body ? body.offsetHeight : 0
        );

        const viewportHeight = (doc && doc.clientHeight) || window.innerHeight || 0;
        const distance = documentHeight - viewportHeight;

        return distance > 0 ? distance : 0;
    };

    const getViewportHeight = () => {
        const doc = document.documentElement;
        return (doc && doc.clientHeight) || window.innerHeight || 0;
    };

    const refreshGeometry = () => {
        maxScroll = readMaxScroll();
    };

    /**
     * Evaluates the mobile breakpoint.
     *
     * matchMedia is the authority because it resolves the same way the
     * stylesheet does, including under zoom and on devices whose reported
     * innerWidth disagrees with the CSS viewport. innerWidth is only the
     * fallback for environments without it.
     *
     * Called from the geometry/milestone path only, never per frame. No
     * listener is registered: a breakpoint cannot be crossed without the
     * viewport resizing, and resize already drives this path.
     *
     * @return {boolean} True when the mobile configuration applies.
     */
    const readIsMobile = () => {
        if (typeof window.matchMedia === 'function') {
            return window.matchMedia(MOBILE_QUERY).matches;
        }

        return (window.innerWidth || 0) <= 768;
    };

    const getScrollTop = () => {
        if (typeof window.scrollY === 'number') {
            return window.scrollY;
        }

        const doc = document.documentElement;
        return (doc && doc.scrollTop) || 0;
    };

    /* ----------------------------------------------------------------------
     * Header awareness
     *
     * A top-edge indicator drawn at y=0 crosses the site header for as long as
     * the header is on screen. The clearance is one page-global number shared by
     * every eligible indicator: resolved and measured on the geometry path,
     * consumed as arithmetic in the frame.
     *
     * WHICH indicators are eligible is decided by render.php and arrives as a
     * class. Everything that answer depends on -- presentation, edge, ring
     * corner, the mobile override and the derived mobile edge -- is already
     * resolved there, so re-deriving it here would be two copies of one rule
     * with two chances to drift.
     * ------------------------------------------------------------------- */

    /**
     * Whether any adopted indicator can consume a clearance at all.
     *
     * A page of bottom bars, side rails or indicators with the setting off does
     * no resolution, no measurement, no observation and no arithmetic.
     */
    const readHeaderNeeded = () => {
        let needed = false;

        instances.forEach((state) => {
            if (state.headerAware) {
                needed = true;
            }
        });

        return needed;
    };

    /**
     * What THIS BLOCK'S stylesheet adds for the WordPress toolbar -- which is
     * deliberately not the same thing as what core displaces.
     *
     * Core bumps the whole document with `html { margin-top: 32px/46px }` at
     * every width, so a header's rect already carries that displacement. But
     * below 601px core drops the toolbar to position:absolute and it scrolls
     * away, so this block's admin-bar rules stop contributing there -- while the
     * bump stays. Normalising against core's bump instead of against this
     * block's own contribution would put the indicator 46px too high on small
     * screens; normalising against this value keeps the final position identical
     * on both sides of that breakpoint.
     */
    const readAdminBaseline = () => {
        const body = document.body;

        if (!body || !body.classList.contains('admin-bar')) {
            return 0;
        }

        const wide = typeof window.matchMedia === 'function'
            ? window.matchMedia(ADMIN_BAR_QUERY).matches
            : (window.innerWidth || 0) >= 601;

        if (!wide) {
            return 0;
        }

        const value = parseFloat(
            window.getComputedStyle(document.documentElement)
                .getPropertyValue('--wp-admin--admin-bar--height')
        );

        return value > 0 ? value : 0;
    };

    /**
     * Conservative plausibility test for a header candidate.
     *
     * The same rendered-ness test heading discovery already uses, plus two
     * bounds: a candidate must sit in the first viewport of the document, which
     * rejects a section header far down the page, and must not be taller than
     * half the viewport, which rejects a full-bleed hero that happens to be
     * marked up as a banner. Failing either is not an error -- it simply means
     * no header, and no clearance.
     *
     * Reads layout, so it only ever runs on the refresh path.
     */
    const isViableHeader = (element) => {
        if (!element || !element.getClientRects().length) {
            return false;
        }

        const rect = element.getBoundingClientRect();

        if (!(rect.height > 0) || rect.height > maxHeaderInset) {
            return false;
        }

        return rect.top + getScrollTop() <= getViewportHeight();
    };

    /**
     * Resolves the page header, semantics first.
     *
     * role="banner" is the explicit answer and is tried alone. Otherwise the
     * first <header> that is not inside a content region wins -- which is what
     * keeps an article header, a duplicated mobile header inside main, and an
     * off-canvas panel from being mistaken for site chrome. No theme class name
     * is consulted.
     */
    const resolveHeader = () => {
        const banner = document.querySelector('[role="banner"]');

        if (banner && !banner.closest(HEADER_EXCLUDE_SELECTOR) && isViableHeader(banner)) {
            headerEl = banner;
            return;
        }

        const candidates = document.querySelectorAll('header');

        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i];

            if (candidate.closest(HEADER_EXCLUDE_SELECTOR)) {
                continue;
            }

            if (isViableHeader(candidate)) {
                headerEl = candidate;
                return;
            }
        }

        headerEl = null;
    };

    /**
     * Caches the two numbers the frame needs.
     *
     * The document bottom carries the scroll-dependent term. The pinned floor is
     * what a fixed or stuck header contributes once the document term has gone
     * past it, and is the reason no sticky state machine is needed: max() of the
     * two is correct before, during and after sticking.
     *
     * A sticky header whose `top` is auto or otherwise non-finite gets a floor
     * of 0, degrading it to normal-flow behaviour rather than guessing at a
     * pinned position.
     *
     * Reads layout, so it only ever runs on the refresh path or in the
     * frame-coalesced remeasure.
     */
    const measureHeader = () => {
        if (!headerEl) {
            headerDocBottom = 0;
            headerPinnedBottom = 0;
            return;
        }

        const rect = headerEl.getBoundingClientRect();

        headerDocBottom = rect.bottom + getScrollTop();

        const styles = window.getComputedStyle(headerEl);
        const position = styles.position;

        if (position === 'fixed') {
            headerPinnedBottom = rect.bottom;
        } else if (position === 'sticky' || position === '-webkit-sticky') {
            const pinned = parseFloat(styles.top);
            headerPinnedBottom = isFinite(pinned) ? pinned + rect.height : 0;
        } else {
            headerPinnedBottom = 0;
        }
    };

    /**
     * Keeps at most one header attached to the shared geometry observer. No
     * second observer is ever constructed, and no instance observes anything.
     */
    const observeHeader = () => {
        if (!geometryObserver || observedHeader === headerEl) {
            return;
        }

        if (observedHeader) {
            geometryObserver.unobserve(observedHeader);
            observedHeader = null;
        }

        if (headerEl) {
            geometryObserver.observe(headerEl);
            observedHeader = headerEl;
        }
    };

    /**
     * Drops every header resource. Called when the last eligible indicator goes
     * away, so observation cannot outlive the reason for it.
     */
    const releaseHeader = () => {
        if (geometryObserver && observedHeader) {
            geometryObserver.unobserve(observedHeader);
        }

        observedHeader = null;
        headerEl = null;
        headerDocBottom = 0;
        headerPinnedBottom = 0;
        headerInsetLast = -1;
    };

    /**
     * One pass on the existing refresh path. Re-resolved from scratch each time,
     * so a header that appeared, moved, was replaced or vanished is one event.
     */
    const refreshHeaderGeometry = () => {
        headerNeeded = readHeaderNeeded();

        if (!headerNeeded) {
            releaseHeader();
            return;
        }

        adminBaseline = readAdminBaseline();
        maxHeaderInset = getViewportHeight() * HEADER_MAX_RATIO;

        resolveHeader();
        measureHeader();
        observeHeader();
    };

    /**
     * The frame value: how much of the top edge the header still occupies,
     * expressed ABOVE the admin-bar baseline because the stylesheet adds that
     * baseline separately.
     *
     * Pure arithmetic on cached numbers -- no rect, no computed style, no query,
     * no allocation. Integer pixels, which is also the write guard's
     * granularity.
     */
    const computeHeaderInset = (scrollTop) => {
        if (!headerEl) {
            return 0;
        }

        const documentTerm = headerDocBottom - scrollTop;
        const viewportBottom = headerPinnedBottom > documentTerm
            ? headerPinnedBottom
            : documentTerm;

        const raw = viewportBottom - adminBaseline;

        if (!(raw > 0)) {
            return 0;
        }

        return (raw < maxHeaderInset ? raw : maxHeaderInset) | 0;
    };

    /**
     * Writes the shared value, and only to indicators that can consume it.
     * Guarded on the integer, so a scroll that does not move the header edge
     * touches no DOM at all -- which is every scroll once the header has gone or
     * has stuck.
     */
    const writeHeaderInset = (scrollTop) => {
        if (!headerNeeded) {
            return;
        }

        const inset = computeHeaderInset(scrollTop);

        if (inset === headerInsetLast) {
            return;
        }

        headerInsetLast = inset;

        instances.forEach((state, element) => {
            if (state.headerAware) {
                element.style.setProperty(HEADER_VAR, inset + 'px');
            }
        });
    };

    /**
     * Reveals eligible indicators after the FIRST resolution attempt -- not
     * after a header is found.
     *
     * That distinction is the whole safety property: a page with no header, a
     * theme the detector cannot read, or a candidate rejected by the guards must
     * still show its indicator at the position it already had. Nothing here can
     * leave an indicator permanently hidden.
     */
    const placeHeaderAwareInstances = () => {
        instances.forEach((state, element) => {
            if (state.headerAware && !state.placed) {
                state.placed = true;
                element.classList.add(PLACED_CLASS);
            }
        });
    };

    /**
     * Frame-coalesced remeasure for a header that changed size.
     *
     * A shrink-on-scroll header, a mobile menu opening and a breakpoint change
     * all resize the header without changing the document, so the shared
     * observer's normal path would either miss them or do unrelated work
     * rebuilding milestones that did not move. This does the one thing that
     * actually changed, at most once per frame, and starts no loop: it is
     * scheduled by an event and never reschedules itself.
     */
    const scheduleHeaderMeasure = () => {
        if (headerFramePending || !headerEl) {
            return;
        }

        headerFramePending = true;

        requestAnimationFrame(() => {
            headerFramePending = false;

            if (!headerEl) {
                return;
            }

            measureHeader();
            requestUpdate();
        });
    };

    /* ----------------------------------------------------------------------
     * Heading discovery
     * ------------------------------------------------------------------- */

    /**
     * Narrowest root that still contains the page content.
     *
     * <main> is what block themes emit for the content area and excludes the
     * header and footer outright. .wp-site-blocks is the fallback for themes
     * that omit it, and body is the last resort.
     */
    const getContentRoot = () => {
        return (
            document.querySelector('main') ||
            document.querySelector('.wp-site-blocks') ||
            document.body
        );
    };

    

    /**
     * The readable text of an element, with aria-hidden subtrees excluded.
     *
     * A block may legitimately render its accessible copy and a decorative,
     * aria-hidden visual copy of the same words - that is correct a11y
     * architecture, not a defect - and textContent concatenates both, so a
     * milestone label came out duplicated. Working on a detached clone keeps
     * the live DOM untouched and reads no layout; innerText is avoided
     * precisely because it would force a synchronous layout.
     *
     * Deliberately generic: it keys off aria-hidden alone and names no block,
     * class or product.
     *
     * @param {Element} element Element to read.
     * @return {string} Normalised readable text.
     */
    const getReadableText = (element) => {
        const clone = element.cloneNode(true);

        clone.querySelectorAll('[aria-hidden="true"]').forEach((node) => {
            node.remove();
        });

        return (clone.textContent || '').replace(/\s+/g, ' ').trim();
    };

    /**
     * Whether a heading currently occupies real layout.
     *
     * getClientRects() is empty for display:none and for a heading inside a
     * collapsed container, which covers accordions and responsive hiding
     * without naming a single theme. The computed check additionally rejects
     * visibility:hidden, which still reports rects.
     *
     * Reads layout; only ever called on the geometry path.
     *
     * @param {Element} element Candidate heading.
     * @return {boolean} True when the heading should become a milestone.
     */
    const isDiscoverableHeading = (element) => {
        if (element.closest(EXCLUDE_SELECTOR)) {
            return false;
        }

        if (!element.getClientRects().length) {
            return false;
        }

        const styles = window.getComputedStyle(element);

        if (styles.visibility === 'hidden' || styles.display === 'none') {
            return false;
        }

        return getReadableText(element).length > 0;
    };

    /**
     * Discovers every candidate heading once, for the widest level set, and
     * caches its activation numbers.
     *
     * h2h3 is a superset of h2, so a single pass serves both configurations and
     * instances differ only by a cheap filter afterwards.
     *
     * A page that cannot scroll produces no milestones: there is no journey to
     * mark, and every trigger would collapse onto the same point.
     *
     * @return {Array<Object>} DOM-ordered heading entries.
     */
    const discoverHeadings = () => {
        if (!(maxScroll > 0)) {
            return [];
        }

        const root = getContentRoot();

        if (!root) {
            return [];
        }

        const viewportHeight = getViewportHeight();
        const scrollTop = getScrollTop();
        const activationOffset = viewportHeight * ACTIVATION_RATIO;
        const found = [];

        root.querySelectorAll(HEADING_SELECTOR).forEach((element) => {
            if (!isDiscoverableHeading(element)) {
                return;
            }

            const absoluteY = element.getBoundingClientRect().top + scrollTop;

            let trigger = absoluteY - activationOffset;

            if (trigger < 0) {
                trigger = 0;
            } else if (trigger > maxScroll) {
                trigger = maxScroll;
            }

            found.push({
                element: element,
                level: element.tagName === 'H3' ? 3 : 2,
                label: getReadableText(element),
                trigger: trigger,
                position: trigger / maxScroll,
            });
        });

        return found;
    };

    /**
     * Reduces a heading list to the configured maximum.
     *
     * Sampling is even and always keeps the first and last heading, so a long
     * page still shows markers across its whole length instead of clustering
     * them at the top. Deterministic: the same page and the same maximum always
     * produce the same markers.
     *
     * The step is strictly greater than 1 whenever this runs, so the rounded
     * indices never repeat.
     *
     * @param {Array<Object>} list Discovered headings in DOM order.
     * @param {number}        max  Configured maximum.
     * @return {Array<Object>} At most `max` entries, still in DOM order.
     */
    const capHeadings = (list, max) => {
        if (list.length <= max) {
            return list;
        }

        const step = (list.length - 1) / (max - 1);
        const out = [];

        for (let i = 0; i < max; i++) {
            out.push(list[Math.round(i * step)]);
        }

        return out;
    };

    

    /* ----------------------------------------------------------------------
     * Milestone DOM
     * ------------------------------------------------------------------- */

    const buildMilestoneItem = (entry, showLabels, majorIndex) => {
        const item = document.createElement('li');

        /*
         * The heading level is already known from discovery, so labelling the
         * item costs nothing extra. It lets CSS show only top-level labels on a
         * dense journey while every marker keeps its state.
         *
         * Top-level items also carry their position within the top-level
         * sequence. A staggered layout showing only those labels has to
         * alternate on that sequence: DOM parity would count the sub-headings
         * sitting between them, whose labels nobody can see.
         */
        item.className =
            'kh-sp-milestone is-upcoming ' +
            (entry.level === 3
                ? 'is-minor'
                : 'is-major ' + (majorIndex % 2 === 1 ? 'is-major-odd' : 'is-major-even'));

        const marker = document.createElement('span');
        marker.className = 'kh-sp-ms-marker';
        item.appendChild(marker);

        if (showLabels) {
            const label = document.createElement('span');
            label.className = 'kh-sp-ms-label';
            // textContent, never innerHTML: heading markup is never re-injected.
            label.textContent = entry.label;
            item.appendChild(label);
        }

        return item;
    };

    /**
     * Rebuilds or repositions one instance's milestone list.
     *
     * The DOM is only rebuilt when the visible set actually changed. A resize
     * that merely moves headings updates positions in place, so scrolling never
     * lands on a half-built list.
     */
    const syncInstanceMilestones = (element, state) => {
        const container = element.querySelector('.kh-sp-milestones');

        if (!container) {
            state.list = [];
            state.signature = '';
            return;
        }

        /*
         * Desktop and mobile each configure their own levels and maximum, and
         * the viewport picks one pair. Both read from the same discovered
         * headings and run through the same cap, so a breakpoint change is a
         * re-selection rather than a second scan or a second engine.
         */
        const effectiveLevels = isMobileViewport ? state.levelsMobile : state.levels;
        const effectiveMax = isMobileViewport ? state.maxMobile : state.max;

        let filtered = effectiveLevels === 'h2h3'
            ? sharedHeadings
            : sharedHeadings.filter((entry) => entry.level === 2);

        

        const selected = capHeadings(filtered, effectiveMax);

        // Level participates in the signature: a heading that changed level but
        // kept its text would otherwise keep a stale major/minor class.
        const signature =
            selected.length +
            '|' +
            selected.map((entry) => entry.level + '~' + entry.label).join('|');

        if (signature !== state.signature) {
            const fragment = document.createDocumentFragment();
            const list = [];

            // Counts top-level headings only, so sub-headings never advance the
            // alternation a staggered layout reads from.
            let majorIndex = 0;

            selected.forEach((entry) => {
                if (entry.level !== 3) {
                    majorIndex++;
                }

                const item = buildMilestoneItem(entry, state.showLabels, majorIndex);

                

                
                item.style.setProperty(MS_POS_VAR, entry.position.toFixed(4));
                

                fragment.appendChild(item);

                
                list.push({ trigger: entry.trigger, item: item, state: 'is-upcoming' });
                
            });

            container.textContent = '';
            container.appendChild(fragment);

            state.list = list;
            state.signature = signature;
        } else {
            // Same milestones, new geometry: move them rather than rebuild.
            for (let i = 0; i < state.list.length; i++) {
                state.list[i].trigger = selected[i].trigger;

                

                
                state.list[i].item.style.setProperty(MS_POS_VAR, selected[i].position.toFixed(4));
                
            }
        }

        // Force the next frame to re-evaluate states against the new triggers.
        state.currentIndex = -2;
    };

    const refreshMilestones = () => {
        milestoneTimer = null;

        if (instances.size === 0) {
            return;
        }

        let wanted = false;

        instances.forEach((state) => {
            if (state.milestonesEnabled) {
                wanted = true;
            }
        });

        if (!wanted) {
            sharedHeadings = [];
            return;
        }

        // Once per refresh, ahead of every instance, so a page carrying several
        // indicators resolves the breakpoint a single time.
        isMobileViewport = readIsMobile();

        
        sharedHeadings = discoverHeadings();
        

        instances.forEach((state, element) => {
            if (state.milestonesEnabled) {
                syncInstanceMilestones(element, state);
            }
        });

        requestUpdate();
    };

    const scheduleMilestoneRefresh = () => {
        if (milestoneTimer) {
            return;
        }

        milestoneTimer = setTimeout(refreshMilestones, MILESTONE_DEBOUNCE_MS);
    };

    /* ----------------------------------------------------------------------
     * Progress and state, per frame
     * ------------------------------------------------------------------- */

    /**
     * Normalized page progress.
     *
     * A page with nothing to scroll reports 0 rather than a partial or full
     * value: the reader has not moved through anything, and a half-filled
     * indicator on a page that cannot scroll would be actively misleading.
     *
     * Overscroll is absorbed at both ends, so elastic/rubber-band scrolling
     * cannot push the value outside 0-1.
     *
     * @param {number} scrollTop Current scroll position.
     * @return {number} Progress between 0 and 1 inclusive.
     */
    const computeProgress = (scrollTop) => {
        if (!(maxScroll > 0)) {
            return 0;
        }

        if (!(scrollTop > 0)) {
            return 0;
        }

        if (scrollTop >= maxScroll) {
            return 1;
        }

        return scrollTop / maxScroll;
    };

    /**
     * Resolves completed / current / upcoming from cached trigger positions.
     *
     * Triggers ascend, so the current milestone is the last one already passed.
     * The comparison is symmetric, which makes scrolling up behave exactly like
     * scrolling down and makes a mid-page load correct on the first frame with
     * no catch-up pass.
     *
     * Nothing touches the DOM while the active milestone is unchanged.
     */
    const applyMilestoneStates = (state, scrollTop) => {
        const list = state.list;
        let currentIndex = -1;

        for (let i = 0; i < list.length; i++) {
            if (scrollTop >= list[i].trigger) {
                currentIndex = i;
            } else {
                break;
            }
        }

        if (currentIndex === state.currentIndex) {
            return;
        }

        state.currentIndex = currentIndex;

        for (let i = 0; i < list.length; i++) {
            const entry = list[i];
            let next;

            if (i < currentIndex) {
                next = 'is-completed';
            } else if (i === currentIndex) {
                next = 'is-current';
            } else {
                next = 'is-upcoming';
            }

            if (entry.state === next) {
                continue;
            }

            entry.item.classList.remove(entry.state);
            entry.item.classList.add(next);
            entry.state = next;

            
        }
    };

    /**
     * One scroll read and one progress calculation per frame, distributed to
     * every instance. No layout reads, no queries, no allocation.
     */
    

    const update = () => {
        framePending = false;

        if (instances.size === 0) {
            return;
        }

        const scrollTop = getScrollTop();
        const serialized = computeProgress(scrollTop).toFixed(3);

        // One shared value for the page, resolved before any instance is
        // visited and written only to those that can use it.
        writeHeaderInset(scrollTop);

        instances.forEach((state, element) => {
            

            if (state.last !== serialized) {
                state.last = serialized;
                element.style.setProperty(PROGRESS_VAR, serialized);
                
            }

            if (state.list.length) {
                applyMilestoneStates(state, scrollTop);
            }
        });
    };

    /**
     * Schedules at most one frame. Deliberately never called from update(),
     * so there is no self-sustaining loop.
     */
    const requestUpdate = () => {
        if (framePending || instances.size === 0) {
            return;
        }

        framePending = true;
        requestAnimationFrame(update);
    };

    /**
     * The single geometry invalidation path. Page metrics are the source of
     * truth and are refreshed first; milestone positions derive from them and
     * follow on a short debounce, because a resizing accordion can fire this
     * many times per second.
     */
    const refreshAndUpdate = () => {
        if (instances.size === 0) {
            return;
        }

        refreshGeometry();
        refreshHeaderGeometry();
        
        scheduleMilestoneRefresh();
        requestUpdate();
    };

    /* ----------------------------------------------------------------------
     * Shared page resources
     * ------------------------------------------------------------------- */

    const onScroll = () => {
        requestUpdate();
    };

    const onResize = () => {
        // Viewport height and page height both change here, including on the
        // orientation change that browsers report as a resize.
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(refreshAndUpdate, RESIZE_DEBOUNCE_MS);
    };

    const onPageShow = () => {
        // Back/forward cache restores a scrolled page without firing scroll.
        refreshAndUpdate();
    };

    const onLoad = () => {
        // Images that finish decoding after DOMContentLoaded change page height.
        refreshAndUpdate();
    };

    const setupPageResources = () => {
        if (pageController) {
            return;
        }

        pageController = new AbortController();
        const { signal } = pageController;

        window.addEventListener('scroll', onScroll, { passive: true, signal });
        window.addEventListener('resize', onResize, { passive: true, signal });
        window.addEventListener('orientationchange', onResize, { passive: true, signal });
        window.addEventListener('pageshow', onPageShow, { passive: true, signal });

        if (document.readyState !== 'complete') {
            window.addEventListener('load', onLoad, { passive: true, signal });
        }

        

        if (typeof ResizeObserver === 'function') {
            /*
             * Observing both roots is deliberate. documentElement alone misses
             * height changes on themes that constrain it, and body alone misses
             * themes that grow the root instead. Content expansion, late media
             * and injected markup all land on at least one of the two.
             *
             * The callback writes custom properties and state classes on the
             * indicator only, so it cannot resize either observed root and
             * cannot loop.
             */
            /*
             * One observer, two paths. A header changing size needs its two
             * cached numbers refreshed and nothing else; the document or a
             * tracked source changing size needs the full geometry pass. Sorting
             * by target here is what keeps an animated shrink-on-scroll header
             * from rebuilding milestones sixty times a second.
             */
            geometryObserver = new ResizeObserver((entries) => {
                for (let i = 0; i < entries.length; i++) {
                    if (entries[i].target !== observedHeader) {
                        refreshAndUpdate();
                        return;
                    }
                }

                scheduleHeaderMeasure();
            });

            geometryObserver.observe(document.documentElement);

            if (document.body) {
                geometryObserver.observe(document.body);
            }
        }

        // Fonts reflow the page once they finish loading. This resolves once
        // and needs no listener to remove.
        if (document.fonts && typeof document.fonts.ready === 'object') {
            document.fonts.ready.then(refreshAndUpdate).catch(() => {});
        }
    };

    const teardownPageResources = () => {
        if (pageController) {
            pageController.abort();
            pageController = null;
        }

        if (geometryObserver) {
            geometryObserver.disconnect();
            geometryObserver = null;
        }

        

        // disconnect() already dropped the header; forget it for the same reason
        // the tracked sources are forgotten above.
        observedHeader = null;
        headerEl = null;
        headerNeeded = false;
        headerDocBottom = 0;
        headerPinnedBottom = 0;
        headerInsetLast = -1;
        headerFramePending = false;

        clearTimeout(resizeTimer);
        clearTimeout(milestoneTimer);
        resizeTimer = null;
        milestoneTimer = null;
        framePending = false;
        maxScroll = 0;
        sharedHeadings = [];
    };

    /* ----------------------------------------------------------------------
     * Instance lifecycle
     * ------------------------------------------------------------------- */

    const addInstance = (element) => {
        if (instances.has(element)) {
            return;
        }

        const max = parseInt(element.dataset.max, 10);
        const maxMobile = parseInt(element.dataset.maxMobile, 10);

        element.classList.add(READY_CLASS);

        instances.set(element, {
            last: null,
            milestonesEnabled: element.classList.contains('has-milestones'),
            levels: element.dataset.levels === 'h2h3' ? 'h2h3' : 'h2',
            max: max >= 3 && max <= 30 ? max : 12,
            levelsMobile: element.dataset.levelsMobile === 'h2h3' ? 'h2h3' : 'h2',
            maxMobile: maxMobile >= 3 && maxMobile <= 30 ? maxMobile : 6,
            showLabels: !element.classList.contains('labels-off'),
            list: [],
            signature: '',
            currentIndex: -2,
            /*
             * The server's answer, read once. Every question it encodes --
             * presentation, edge, ring corner, mobile override -- was already
             * resolved during render, so the frame's test is a property read.
             */
            headerAware: element.classList.contains(HEADER_AWARE_CLASS),
            placed: false,
            
        });

        
    };

    const removeInstance = (element) => {
        instances.delete(element);
        element.classList.remove(READY_CLASS);
        /*
         * A detached node can be reinserted. Leaving the placement class behind
         * would let the next adoption paint at the old position before its first
         * measurement -- exactly the flash the class exists to prevent.
         */
        element.classList.remove(PLACED_CLASS);
        
    };

    /**
     * Reconciles the manager against the DOM. Detached blocks are dropped and
     * newly inserted ones are adopted; both are idempotent. Headings are
     * rediscovered in the same pass, so an AJAX insertion that carries both a
     * block and new sections costs one sync rather than two.
     */
    const syncInstances = () => {
        syncTimer = null;

        instances.forEach((state, element) => {
            if (!element.isConnected) {
                removeInstance(element);
            }
        });

        document
            .querySelectorAll(BLOCK_SELECTOR + ':not(.' + READY_CLASS + ')')
            .forEach(addInstance);

        if (instances.size === 0) {
            teardownPageResources();
            return;
        }

        setupPageResources();
        refreshGeometry();
        refreshHeaderGeometry();
        
        refreshMilestones();

        // Written before the reveal, so a block inserted into a live page lands
        // at its final position rather than at the top edge for one frame.
        writeHeaderInset(getScrollTop());
        placeHeaderAwareInstances();

        requestUpdate();
    };

    const scheduleSync = () => {
        if (syncTimer) {
            return;
        }

        syncTimer = setTimeout(syncInstances, SYNC_DELAY_MS);
    };

    /**
     * Cheap relevance test for a mutated subtree: either an indicator moved, or
     * the set of content headings may have changed.
     */
    const isRelevantNode = (node) => {
        if (!node || node.nodeType !== 1) {
            return false;
        }

        const tag = node.tagName;

        if (tag === 'H2' || tag === 'H3') {
            return true;
        }

        if (node.classList && node.classList.contains('kh-sp-wrapper')) {
            return true;
        }

        /*
         * Two header cases, both gated so an ordinary page keeps the cheap path.
         *
         * The resolved header being removed or rewritten has to re-resolve
         * rather than go stale -- a theme can replace its header markup outright
         * without changing the page's dimensions, so the ResizeObserver would
         * never fire.
         *
         * And while NO header has been resolved yet, an inserted node may be the
         * one being waited for: hydration, a theme script swapping the header in,
         * a responsive header injected after load. That branch only runs when a
         * header is genuinely wanted and genuinely missing, so a normal page --
         * where the header resolved at init -- never reaches the query. Nothing
         * polls for it.
         */
        if (headerEl && (node === headerEl || (node.contains && node.contains(headerEl)))) {
            return true;
        }

        if (headerNeeded && !headerEl && node.querySelector) {
            if (node.tagName === 'HEADER' || node.getAttribute('role') === 'banner') {
                return true;
            }

            if (node.querySelector('header, [role="banner"]')) {
                return true;
            }
        }

        

        if (!node.querySelector) {
            return false;
        }

        return !!(node.querySelector(BLOCK_SELECTOR) || node.querySelector(HEADING_SELECTOR));
    };

    /**
     * One shared observer for the whole page. It survives teardown so a block
     * injected long after the last one was removed is still picked up, and it
     * does nothing while the DOM is idle.
     *
     * childList and subtree only: attribute and character data mutations are
     * far more frequent and are already covered, because anything that changes
     * layout reaches the ResizeObserver instead.
     */
    const setupLifecycleObserver = () => {
        if (lifecycleObserver || typeof MutationObserver !== 'function') {
            return;
        }

        lifecycleObserver = new MutationObserver((mutations) => {
            for (let i = 0; i < mutations.length; i++) {
                const mutation = mutations[i];

                for (let j = 0; j < mutation.addedNodes.length; j++) {
                    if (isRelevantNode(mutation.addedNodes[j])) {
                        scheduleSync();
                        return;
                    }
                }

                for (let k = 0; k < mutation.removedNodes.length; k++) {
                    if (isRelevantNode(mutation.removedNodes[k])) {
                        scheduleSync();
                        return;
                    }
                }
            }
        });

        lifecycleObserver.observe(document.body, { childList: true, subtree: true });
    };

    /* ----------------------------------------------------------------------
     * Boot
     * ------------------------------------------------------------------- */

    const init = () => {
        document.querySelectorAll(BLOCK_SELECTOR).forEach(addInstance);

        setupLifecycleObserver();

        if (instances.size === 0) {
            return;
        }

        setupPageResources();
        refreshGeometry();
        refreshHeaderGeometry();
        

        // Immediate, not debounced: the first paint must already be correct.
        refreshMilestones();

        /*
         * Paint the correct value straight away. A restored scroll position, an
         * anchored deep link and a bfcache restore all arrive without a scroll
         * event, so waiting for one would leave the indicator empty.
         */
        update();

        /*
         * Last, and in the same synchronous pass: by now the header has been
         * resolved (or conclusively not found) and the clearance written, so
         * revealing cannot expose a wrong position. Unconditional on the outcome
         * -- a page with no header reveals exactly where it already was.
         */
        placeHeaderAwareInstances();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
