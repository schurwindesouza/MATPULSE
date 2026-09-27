import React, { useEffect, useRef, useState } from 'react';

/**
 * SplineBackground
 * Robust animated Spline 3D background component.
 * - Container: position: absolute; inset: 0; width: 100%; height: 100%; display: block; z-index: 0; overflow: hidden; background: #000;
 * - Fallback: background: #000 underneath the Spline viewer to prevent blank/white flashes.
 * - Viewer: <spline-viewer url="..." loading="eager" renderer="auto"> (explicitly disables lazy loading).
 * - Subtle loading state: minimal white indicator that disappears when the Spline scene becomes available.
 * - No opaque layer above the Spline viewer.
 */
export default function SplineBackground({
  sceneUrl = 'https://prod.spline.design/hgFlPE4D202sp0wp/scene.splinecode',
  className = '',
  onLoad,
}) {
  const viewerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Explicitly enforce eager loading attribute and property
    viewer.setAttribute('loading', 'eager');
    viewer.setAttribute('url', sceneUrl);
    viewer.setAttribute('renderer', 'auto');
    if ('loading' in viewer) {
      viewer.loading = 'eager';
    }

    const handleLoad = () => {
      if (isMounted) {
        setIsLoaded(true);
        if (onLoad) onLoad();
      }
    };

    const handleError = (e) => {
      console.error('[SplineBackground] Spline viewer event error:', e?.detail || e);
    };

    viewer.addEventListener('load-complete', handleLoad);
    viewer.addEventListener('splineerror', handleError);

    // If custom element is already defined and canvas is rendered
    if (viewer.shadowRoot?.querySelector('canvas')) {
      setIsLoaded(true);
      if (onLoad) onLoad();
    }

    // Safety polling check for canvas availability (in case load-complete fired before listener attachment)
    const checkInterval = setInterval(() => {
      if (!isMounted) return;
      if (viewer.shadowRoot?.querySelector('canvas')) {
        setIsLoaded(true);
        if (onLoad) onLoad();
        clearInterval(checkInterval);
      }
    }, 250);

    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(checkInterval);
      clearTimeout(timeout);
      viewer.removeEventListener('load-complete', handleLoad);
      viewer.removeEventListener('splineerror', handleError);
    };
  }, [sceneUrl, onLoad]);

  return (
    <div
      className={`spline-container ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        zIndex: 0,
        overflow: 'hidden',
        backgroundColor: '#000',
        pointerEvents: 'none',
      }}
    >
      {/* Fallback subtle loading indicator UNDERNEATH the Spline viewer (disappears when loaded) */}
      {!isLoaded && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.07] border border-white/10 pointer-events-none transition-opacity duration-300"
          style={{
            position: 'absolute',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 0,
          }}
          aria-hidden="true"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[11px] uppercase tracking-widest font-mono text-white/60 select-none">
            Loading 3D Scene
          </span>
        </div>
      )}

      {/* The Spline Viewer with loading="eager" - explicitly disables lazy loading */}
      <spline-viewer
        ref={viewerRef}
        url={sceneUrl}
        loading="eager"
        renderer="auto"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          zIndex: 1,
          pointerEvents: 'auto',
        }}
      ></spline-viewer>
    </div>
  );
}
