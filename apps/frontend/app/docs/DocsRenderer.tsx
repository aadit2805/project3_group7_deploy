'use client';

import { useEffect, useRef } from 'react';

interface DocsRendererProps {
  bodyContent: string;
  cssLinks: string[];
  scripts: string[];
  inlineScripts: string[];
  dataBase?: string;
}

/**
 * Client component to render TypeDoc documentation
 * Handles CSS injection and script execution
 */
export default function DocsRenderer({
  bodyContent,
  cssLinks,
  scripts,
  inlineScripts,
  dataBase = './',
}: DocsRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptsLoadedRef = useRef(false);

  useEffect(() => {
    // Set data-base attribute on documentElement (TypeDoc needs this)
    if (dataBase && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-base', dataBase);
    }
    
    // Force light mode
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
    }

    // Inject CSS links into the head
    cssLinks.forEach((href) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    });

    // Inject custom CSS to make sidebar wider and fix text clipping
    const customStyle = document.createElement('style');
    customStyle.id = 'typedoc-custom-sidebar-width';
    customStyle.textContent = `
      /* Force light mode only - comprehensive overrides */
      :root,
      html,
      body,
      html[data-theme='dark'],
      body[data-theme='dark'],
      html[data-theme='light'],
      body[data-theme='light'] {
        --color-background: #ffffff !important;
        --color-background-secondary: #f8f9fa !important;
        --color-background-warning: #fffbdd !important;
        --color-text: #222222 !important;
        --color-text-aside: #6e6e6e !important;
        --color-link: #1e70bf !important;
        --color-ts: #9600ff !important;
        --color-ts-interface: #647f1b !important;
        --color-ts-enum: #937210 !important;
        --color-ts-class: #0672de !important;
        --color-ts-private: #707070 !important;
        --color-icon-background: #ffffff !important;
        --color-accent: #c5c7c9 !important;
        --color-active-menu-item: rgba(0, 0, 0, 0.1) !important;
        --color-code-background: #f5f5f5 !important;
        --color-document: #ffffff !important;
        color-scheme: light !important;
        background: #ffffff !important;
        color: #222222 !important;
      }
      
      /* Force all backgrounds to be light */
      body,
      .container,
      .container-main,
      .col-content,
      .tsd-panel,
      .tsd-page-title,
      .tsd-typography,
      section {
        background-color: #ffffff !important;
        background: #ffffff !important;
        color: #222222 !important;
      }
      
      /* Fix dark boxes and panels */
      .tsd-index-content,
      .tsd-member,
      .tsd-member-group,
      .tsd-signatures,
      .tsd-signature,
      .tsd-description,
      dl,
      dd,
      dt {
        background-color: #ffffff !important;
        background: #ffffff !important;
        color: #222222 !important;
      }
      
      /* Fix all text to be dark */
      h1, h2, h3, h4, h5, h6,
      p, span, a, li, td, th,
      .tsd-signature-symbol,
      .tsd-signature-type,
      .tsd-kind-icon {
        color: #222222 !important;
      }
      
      /* Links should be visible */
      a {
        color: #1e70bf !important;
      }
      
      a:hover {
        color: #145a99 !important;
      }
      
      /* Code blocks */
      code,
      pre {
        background-color: #f5f5f5 !important;
        color: #222222 !important;
      }
      
      /* Hide the left sidebar completely */
      .col-sidebar,
      .site-menu {
        display: none !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }
      
      /* Improve main container layout - center everything */
      .container-main {
        max-width: 1200px !important;
        margin: 0 auto !important;
        padding: 0 2rem !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 2rem !important;
      }
      
      /* Make content area centered and full width */
      .col-content {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
        order: 2 !important;
      }
      
      /* Center the TOC (table of contents) section */
      .page-menu {
        width: 100% !important;
        max-width: 800px !important;
        margin: 0 auto !important;
        padding: 1.5rem !important;
        background: var(--color-background-secondary, #f8f9fa) !important;
        border-radius: 8px !important;
        border-left: 3px solid var(--color-text, #333) !important;
        order: 1 !important;
      }
      
      /* Improve TOC navigation styling */
      .tsd-page-navigation {
        font-size: 0.95rem !important;
      }
      
      .tsd-page-navigation a {
        padding: 0.5rem 0.75rem !important;
        margin: 0.25rem 0 !important;
        border-radius: 4px !important;
        transition: background-color 0.2s ease !important;
        display: block !important;
        text-decoration: none !important;
        color: var(--color-text, #333) !important;
      }
      
      .tsd-page-navigation a:hover {
        background-color: var(--color-active-menu-item, rgba(0, 0, 0, 0.05)) !important;
      }
      
      .tsd-page-navigation a.current {
        background-color: var(--color-active-menu-item, rgba(0, 0, 0, 0.1)) !important;
        font-weight: 600 !important;
      }
      
      /* Folder organization styling */
      .docs-organized-modules {
        width: 100% !important;
      }
      
      .docs-folder-group {
        margin-bottom: 1.5rem !important;
      }
      
      .docs-folder-group dl.tsd-member-summaries {
        margin: 0 !important;
        padding: 0.5rem 0 !important;
      }
      
      .docs-folder-header {
        padding: 0.75rem 1rem !important;
        background: var(--color-background, #fff) !important;
        border: 1px solid var(--color-text, #333) !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-weight: 600 !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        transition: all 0.2s ease !important;
        margin-bottom: 0.5rem !important;
      }
      
      .docs-folder-header:hover {
        background: var(--color-background-secondary, #f8f9fa) !important;
      }
      
      .docs-folder-header.expanded {
        border-bottom-left-radius: 0 !important;
        border-bottom-right-radius: 0 !important;
        border-bottom: none !important;
      }
      
      .docs-folder-icon {
        transition: transform 0.2s ease !important;
      }
      
      .docs-folder-header.expanded .docs-folder-icon {
        transform: rotate(90deg) !important;
      }
      
      .docs-folder-content {
        max-height: 0 !important;
        overflow: hidden !important;
        transition: max-height 0.3s ease !important;
        border: 1px solid var(--color-text, #333) !important;
        border-top: none !important;
        border-radius: 0 0 4px 4px !important;
        background: var(--color-background-secondary, #f8f9fa) !important;
      }
      
      .docs-folder-content.expanded {
        max-height: 5000px !important;
        padding: 0.5rem 0 !important;
      }
      
      .docs-folder-item {
        padding: 0.5rem 1.5rem !important;
      }
      
      .docs-folder-item a {
        padding: 0.5rem 0.75rem !important;
        margin: 0.25rem 0 !important;
      }
      
      /* Improve page title and headers */
      .tsd-page-title {
        margin-bottom: 2rem !important;
        padding-bottom: 1rem !important;
        border-bottom: 2px solid var(--color-text, #333) !important;
      }
      
      .tsd-page-title h1 {
        font-size: 2rem !important;
        margin: 0 !important;
      }
      
      /* Improve content panels */
      .tsd-panel {
        margin-bottom: 2rem !important;
        padding: 1.5rem !important;
        background: var(--color-background, #fff) !important;
        border-radius: 6px !important;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
      }
      
      /* Better spacing for member summaries */
      .tsd-member-summaries {
        margin-top: 1rem !important;
      }
      
      /* Improve accordion styling */
      .tsd-accordion-summary {
        padding: 0.75rem !important;
        font-weight: 500 !important;
        cursor: pointer !important;
      }
      
      .tsd-accordion-summary:hover {
        background-color: rgba(0, 0, 0, 0.02) !important;
      }
      
      /* Navigation bar styling */
      .docs-navigation-bar {
        position: sticky !important;
        top: 0 !important;
        z-index: 1000 !important;
        background: var(--color-background, #fff) !important;
        border-bottom: 2px solid var(--color-text, #333) !important;
        padding: 1rem 2rem !important;
        margin: 0 -2rem 2rem -2rem !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        flex-wrap: wrap !important;
        gap: 1rem !important;
      }
      
      .docs-nav-buttons {
        display: flex !important;
        gap: 0.75rem !important;
        flex-wrap: wrap !important;
      }
      
      .docs-nav-button {
        padding: 0.5rem 1rem !important;
        background: var(--color-background-secondary, #f8f9fa) !important;
        border: 1px solid var(--color-text, #333) !important;
        border-radius: 4px !important;
        color: var(--color-text, #333) !important;
        text-decoration: none !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 0.5rem !important;
      }
      
      .docs-nav-button:hover {
        background: var(--color-text, #333) !important;
        color: var(--color-background, #fff) !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
      }
      
      .docs-breadcrumb {
        display: flex !important;
        align-items: center !important;
        gap: 0.5rem !important;
        flex-wrap: wrap !important;
        font-size: 0.9rem !important;
      }
      
      .docs-breadcrumb a {
        color: var(--color-text, #333) !important;
        text-decoration: none !important;
        padding: 0.25rem 0.5rem !important;
        border-radius: 3px !important;
        transition: background-color 0.2s ease !important;
      }
      
      .docs-breadcrumb a:hover {
        background-color: var(--color-background-secondary, #f8f9fa) !important;
      }
      
      .docs-breadcrumb-separator {
        color: var(--color-text-muted, #666) !important;
      }
      
      /* Make all documentation links more prominent */
      .col-content a:not(.docs-nav-button) {
        color: var(--color-text-link, #0066cc) !important;
        text-decoration: underline !important;
        font-weight: 500 !important;
        transition: color 0.2s ease !important;
      }
      
      .col-content a:not(.docs-nav-button):hover {
        color: var(--color-text-link-hover, #0052a3) !important;
        text-decoration: underline !important;
      }
      
      /* Improve module/class links */
      .tsd-index-accordion a,
      .tsd-member-summaries a {
        font-size: 1.05rem !important;
        padding: 0.5rem !important;
        display: block !important;
        border-radius: 4px !important;
      }
      
      .tsd-index-accordion a:hover,
      .tsd-member-summaries a:hover {
        background-color: var(--color-background-secondary, #f8f9fa) !important;
      }
      
      /* Better mobile responsiveness */
      @media (max-width: 1024px) {
        .container-main {
          padding: 0 1rem !important;
        }
        
        .docs-navigation-bar {
          margin: 0 -1rem 2rem -1rem !important;
          padding: 1rem !important;
        }
        
        .page-menu {
          order: -1 !important;
          margin-bottom: 2rem !important;
          position: relative !important;
          top: 0 !important;
          max-height: none !important;
        }
      }
    `;
    document.head.appendChild(customStyle);

    return () => {
      // Cleanup: remove injected stylesheets
      cssLinks.forEach((href) => {
        const links = document.head.querySelectorAll(`link[href="${href}"]`);
        links.forEach((link) => link.remove());
      });
      // Cleanup: remove custom style
      const customStyleEl = document.getElementById('typedoc-custom-sidebar-width');
      if (customStyleEl) {
        customStyleEl.remove();
      }
      // Cleanup: remove data-base attribute
      if (typeof document !== 'undefined') {
        document.documentElement.removeAttribute('data-base');
      }
    };
  }, [cssLinks, dataBase]);

  // Load scripts after body content is rendered
  useEffect(() => {
    if (scriptsLoadedRef.current || !containerRef.current) return;
    
    const loadedScripts: HTMLScriptElement[] = [];
    const loadedInlineScripts: HTMLScriptElement[] = [];
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Patch Object.defineProperty to make window.app configurable
    const originalDefineProperty = Object.defineProperty;
    let definePropertyPatched = false;
    
    if (typeof window !== 'undefined' && !(window as any).__typedocDefinePropertyPatched) {
      Object.defineProperty = function(
        this: typeof Object,
        obj: any,
        prop: string | symbol,
        descriptor: PropertyDescriptor
      ): any {
        // If trying to define window.app, make it configurable
        if (obj === window && prop === 'app') {
          return originalDefineProperty.call(this, obj, prop, {
            ...descriptor,
            configurable: true,
            writable: true,
          });
        }
        return originalDefineProperty.call(this, obj, prop, descriptor);
      } as typeof Object.defineProperty;
      (window as any).__typedocDefinePropertyPatched = true;
      definePropertyPatched = true;
    }
    
    // Wait for the body content to be in the DOM
    const checkAndLoadScripts = () => {
      // Check if required elements exist (for search functionality)
      const searchTrigger = containerRef.current?.querySelector('#tsd-search-trigger');
      if (!searchTrigger && scripts.length > 0) {
        // Elements not ready yet, try again
        timeoutId = setTimeout(checkAndLoadScripts, 50);
        return;
      }

      scriptsLoadedRef.current = true;

      // Clean up window.app if it exists before loading scripts
      if (typeof window !== 'undefined' && (window as any).app) {
        try {
          delete (window as any).app;
        } catch (e) {
          // Ignore if can't delete
        }
      }

      // Load external scripts
      scripts.forEach((src) => {
        // Check if script already exists
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
          return; // Skip if already loaded
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        if (src.includes('search.js')) {
          script.id = 'tsd-search-script';
        } else if (src.includes('icons.js')) {
          script.id = 'tsd-icons-script';
        } else if (src.includes('navigation.js')) {
          script.id = 'tsd-nav-script';
        }
        document.body.appendChild(script);
        loadedScripts.push(script);
      });

      // Execute inline scripts (but only if window.app doesn't exist to avoid redefinition)
      inlineScripts.forEach((script) => {
        // Skip inline scripts that define window.app if it already exists
        if (script.includes('window.app') && (window as any).app) {
          return;
        }
        const scriptEl = document.createElement('script');
        scriptEl.textContent = script;
        document.body.appendChild(scriptEl);
        loadedInlineScripts.push(scriptEl);
      });
    };

    // Small delay to ensure DOM is ready
    timeoutId = setTimeout(checkAndLoadScripts, 100);

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      scriptsLoadedRef.current = false;
      
      // Remove loaded scripts
      loadedScripts.forEach((script) => {
        script.remove();
      });
      loadedInlineScripts.forEach((script) => {
        script.remove();
      });
      
      // Restore original Object.defineProperty if we patched it
      if (definePropertyPatched && typeof window !== 'undefined') {
        // Note: We can't fully restore it, but the patch should be harmless
        // and will prevent the redefinition error
      }
      
      // Clean up window.app if it exists
      if (typeof window !== 'undefined' && (window as any).app) {
        try {
          delete (window as any).app;
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [scripts, inlineScripts]);

  // Add navigation bar and improve navigation
  useEffect(() => {
    if (!containerRef.current) return;

    // Determine if we're in frontend or backend docs based on current URL
    const isFrontend = window.location.pathname.startsWith('/docs/frontend');
    const basePath = isFrontend ? '/docs/frontend' : '/docs/backend';
    const indexPath = `${basePath}/index.html`;
    const docsIndexPath = '/docs'; // Always go to main docs page

    // Create navigation bar
    const createNavigationBar = () => {
      if (!containerRef.current) return;
      
      // Check if nav bar already exists
      if (containerRef.current.querySelector('.docs-navigation-bar')) {
        return;
      }

      const navBar = document.createElement('div');
      navBar.className = 'docs-navigation-bar';

      // Build breadcrumb
      const breadcrumb = document.createElement('div');
      breadcrumb.className = 'docs-breadcrumb';
      
      const pathParts = window.location.pathname.split('/').filter(p => p);
      let breadcrumbHTML = `<a href="${docsIndexPath}">Documentation</a>`;
      
      if (pathParts.length > 1) {
        const section = pathParts[1]; // 'frontend' or 'backend'
        breadcrumbHTML += ` <span class="docs-breadcrumb-separator">›</span> `;
        breadcrumbHTML += `<a href="${basePath}/index.html">${section.charAt(0).toUpperCase() + section.slice(1)}</a>`;
        
        if (pathParts.length > 2) {
          const currentPage = pathParts.slice(2).join('/');
          if (currentPage !== 'index.html') {
            breadcrumbHTML += ` <span class="docs-breadcrumb-separator">›</span> `;
            breadcrumbHTML += `<span>${currentPage.replace('.html', '').replace(/\//g, ' › ')}</span>`;
          }
        }
      }
      
      breadcrumb.innerHTML = breadcrumbHTML;

      // Create navigation buttons
      const navButtons = document.createElement('div');
      navButtons.className = 'docs-nav-buttons';
      
      navButtons.innerHTML = `
        <a href="${docsIndexPath}" class="docs-nav-button">🏠 Home</a>
      `;

      navBar.appendChild(breadcrumb);
      navBar.appendChild(navButtons);

      // Insert at the beginning of the container
      const firstChild = containerRef.current.firstChild;
      if (firstChild) {
        containerRef.current.insertBefore(navBar, firstChild);
      } else {
        containerRef.current.appendChild(navBar);
      }
    };

      // Organize main content modules by folders
      const organizeTOCByFolders = () => {
        if (!containerRef.current) return;
        
        // Find the main content area with module summaries
        const memberSummaries = containerRef.current.querySelector('.tsd-member-summaries');
        if (!memberSummaries) return;

        // Check if already organized
        if (memberSummaries.querySelector('.docs-folder-group')) return;

        // Get all module summary items
        const summaryItems = Array.from(memberSummaries.querySelectorAll('dt.tsd-member-summary'));
        if (summaryItems.length === 0) return;

        // Group items by folder
        const folderGroups: Map<string, HTMLElement[]> = new Map();

        summaryItems.forEach((item) => {
          const link = item.querySelector('a[href*="modules/"]') as HTMLAnchorElement;
          if (!link) return;

          const href = link.getAttribute('href') || '';
          const text = link.textContent?.trim() || '';
          
          // Extract folder from href like "modules/controllers_auditController.html" -> "controllers"
          // or from text like "controllers/auditController" -> "controllers"
          let folderName = '';
          
          // Try to extract from href first
          const hrefMatch = href.match(/modules\/([^_]+)_/);
          if (hrefMatch) {
            folderName = hrefMatch[1];
          } else {
            // Try to extract from text
            const textMatch = text.match(/^([^/]+)\//);
            if (textMatch) {
              folderName = textMatch[1];
            }
          }

          if (folderName) {
            if (!folderGroups.has(folderName)) {
              folderGroups.set(folderName, []);
            }
            folderGroups.get(folderName)!.push(item as HTMLElement);
          } else {
            // Root level items (like "index")
            if (!folderGroups.has('_root')) {
              folderGroups.set('_root', []);
            }
            folderGroups.get('_root')!.push(item as HTMLElement);
          }
        });

        if (folderGroups.size === 0) return;

        // Store the parent container
        const parentContainer = memberSummaries.parentElement;
        if (!parentContainer) return;

        // Create a new container for organized content
        const organizedContainer = document.createElement('dl');
        organizedContainer.className = 'tsd-member-summaries docs-organized-modules';

        // Sort folders alphabetically (except _root which goes last)
        const sortedFolders = Array.from(folderGroups.entries()).sort((a, b) => {
          if (a[0] === '_root') return 1;
          if (b[0] === '_root') return -1;
          return a[0].localeCompare(b[0]);
        });

        // Create folder groups
        sortedFolders.forEach(([folderName, items]) => {
          if (folderName === '_root') {
            // Root level items - add directly
            items.forEach((item) => {
              organizedContainer.appendChild(item.cloneNode(true) as HTMLElement);
            });
          } else {
            // Create folder group wrapper
            const folderGroup = document.createElement('div');
            folderGroup.className = 'docs-folder-group';

            // Create folder header
            const folderHeader = document.createElement('div');
            folderHeader.className = 'docs-folder-header';
            folderHeader.innerHTML = `
              <span>${folderName.charAt(0).toUpperCase() + folderName.slice(1)}</span>
              <span class="docs-folder-icon">▶</span>
            `;

            // Create folder content
            const folderContent = document.createElement('div');
            folderContent.className = 'docs-folder-content';

            // Create a dl element for the folder items
            const folderDL = document.createElement('dl');
            folderDL.className = 'tsd-member-summaries';

            // Add items to folder content
            items.forEach((item) => {
              folderDL.appendChild(item.cloneNode(true) as HTMLElement);
            });

            folderContent.appendChild(folderDL);

            // Toggle functionality
            folderHeader.addEventListener('click', () => {
              const isExpanded = folderHeader.classList.contains('expanded');
              if (isExpanded) {
                folderHeader.classList.remove('expanded');
                folderContent.classList.remove('expanded');
              } else {
                folderHeader.classList.add('expanded');
                folderContent.classList.add('expanded');
              }
            });

            folderGroup.appendChild(folderHeader);
            folderGroup.appendChild(folderContent);
            organizedContainer.appendChild(folderGroup);
          }
        });

        // Replace the original content
        memberSummaries.replaceWith(organizedContainer);
      };

      // Wait a bit for content to render, then add nav bar and organize TOC
      const timeoutId = setTimeout(() => {
        if (!containerRef.current) return;
        
        createNavigationBar();
        
        // Fix breadcrumb links after creation
        const breadcrumbLinks = containerRef.current.querySelectorAll('.docs-navigation-bar a');
        breadcrumbLinks.forEach((link) => {
          const href = link.getAttribute('href');
          if (href && !href.startsWith('http') && !href.startsWith('//')) {
            // Links are already correct, but ensure they work
            link.addEventListener('click', (e) => {
              // Let Next.js handle navigation
            });
          }
        });

        // Organize TOC by folders - wait a bit longer for TypeDoc's navigation to load
        setTimeout(() => {
          organizeTOCByFolders();
        }, 500);
      }, 300);

      return () => {
        clearTimeout(timeoutId);
      };
    }, [bodyContent]);

  // Fix links dynamically that TypeDoc's JavaScript creates
  useEffect(() => {
    if (!containerRef.current) return;

    // Determine if we're in frontend or backend docs based on current URL
    const isFrontend = window.location.pathname.startsWith('/docs/frontend');
    const basePath = isFrontend ? '/docs/frontend' : '/docs/backend';

    // Fix all links in the container - run continuously to catch dynamically added links
    const fixAllLinks = () => {
      const links = containerRef.current?.querySelectorAll('a[href]');
      links?.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href) return;

        // Skip hash-only links, external links, and the home button
        if (href.startsWith('#') || href.startsWith('http') || href.startsWith('//') || href === '/docs') {
          return;
        }

        // Fix links that are missing the base path
        // Check if it starts with /docs/ but not /docs/frontend/ or /docs/backend/
        if (href.startsWith('/docs/') && !href.startsWith(basePath)) {
          // Extract the path after /docs/
          const pathAfterDocs = href.replace(/^\/docs\//, '');
          const fixedHref = `${basePath}/${pathAfterDocs}`;
          link.setAttribute('href', fixedHref);
          // Also update the actual href property
          (link as HTMLAnchorElement).href = fixedHref;
          return;
        }

        // Skip already-correct links
        if (href.startsWith(basePath)) {
          return;
        }

        // Fix absolute paths that don't have base path (like /modules/...)
        if (href.startsWith('/') && !href.startsWith('/docs/')) {
          const fixedHref = `${basePath}${href}`;
          link.setAttribute('href', fixedHref);
          (link as HTMLAnchorElement).href = fixedHref;
          return;
        }

        // Fix relative paths - resolve them properly
        if (!href.startsWith('/')) {
          const currentPath = window.location.pathname;
          const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
          try {
            const resolvedPath = new URL(href, `http://example.com${currentDir}/`).pathname;
            const fixedHref = `${basePath}${resolvedPath}`;
            link.setAttribute('href', fixedHref);
            (link as HTMLAnchorElement).href = fixedHref;
          } catch (e) {
            // If URL resolution fails, just prepend base path
            const fixedHref = `${basePath}/${href}`;
            link.setAttribute('href', fixedHref);
            (link as HTMLAnchorElement).href = fixedHref;
          }
        }
      });
    };

    // Fix links immediately
    fixAllLinks();

    // Set up observer for dynamically added links (TypeDoc's JS adds them)
    const observer = new MutationObserver(() => {
      fixAllLinks();
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href'],
    });

    // Also run more frequently to catch TypeDoc's dynamic link generation
    const interval = setInterval(fixAllLinks, 200);
    
    // Intercept clicks to fix links on-the-fly if they're still wrong
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a') as HTMLAnchorElement;
      
      if (!link || !link.href) return;
      
      const href = link.getAttribute('href') || link.href;
      if (!href) return;
      
      // Skip hash-only links, external links, and the home button
      if (href.startsWith('#') || href.startsWith('http') || href.startsWith('//') || href === '/docs') {
        return;
      }
      
      // Fix broken links on click
      if (href.startsWith('/docs/') && !href.startsWith(basePath)) {
        const pathAfterDocs = href.replace(/^\/docs\//, '');
        const fixedHref = `${basePath}/${pathAfterDocs}`;
        link.setAttribute('href', fixedHref);
        (link as HTMLAnchorElement).href = fixedHref;
        e.preventDefault();
        window.location.href = fixedHref;
        return;
      }
      
      if (href.startsWith('/') && !href.startsWith('/docs/') && !href.startsWith(basePath)) {
        const fixedHref = `${basePath}${href}`;
        link.setAttribute('href', fixedHref);
        (link as HTMLAnchorElement).href = fixedHref;
        e.preventDefault();
        window.location.href = fixedHref;
        return;
      }
    };
    
    const currentContainer = containerRef.current;
    currentContainer.addEventListener('click', handleClick, true); // Use capture phase
    
    return () => {
      observer.disconnect();
      clearInterval(interval);
      if (currentContainer) {
        currentContainer.removeEventListener('click', handleClick, true);
      }
    };
  }, [bodyContent]);

  return (
    <div className="docs-light-mode-wrapper" style={{ 
      colorScheme: 'light',
      backgroundColor: '#ffffff',
      color: '#333333',
      minHeight: '100vh'
    }}>
      {/* Render body content */}
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </div>
  );
}

