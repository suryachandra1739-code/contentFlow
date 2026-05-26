'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import NewPost from '@/app/(dashboard)/posts/new/page';
import React from 'react';

export default function MobileGestureWrapper({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [showNewPostSheet, setShowNewPostSheet] = useState(false);
  const [isSwipingBack, setIsSwipingBack] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [sheetOffset, setSheetOffset] = useState(0);
  const [isSwipingSheet, setIsSwipingSheet] = useState(false);

  const touchStart = useRef({ x: 0, y: 0 });
  const touchCurrent = useRef({ x: 0, y: 0 });

  // Track responsive screen size client-side to dynamically apply gestures
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dynamically inject onOpenNewPost callback to Sidebar child
  const childrenArray = React.Children.toArray(children);
  const sidebarChild = childrenArray[0];
  const mainContentChild = childrenArray[1];

  const injectedSidebar = React.isValidElement(sidebarChild)
    ? React.cloneElement(sidebarChild, { onOpenNewPost: () => setShowNewPostSheet(true) })
    : sidebarChild;

  // Render original un-wrapped layout structure on desktop viewports
  if (!isMobile) {
    return (
      <>
        {injectedSidebar}
        {mainContentChild}
      </>
    );
  }

  // Touch gesture handlers for mobile viewports
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    touchCurrent.current = { x: touch.clientX, y: touch.clientY };

    // Detect left edge swipe back (Only if not on main home dashboard and not displaying overlay sheet)
    if (touch.clientX < 40 && pathname !== '/' && !showNewPostSheet) {
      setIsSwipingBack(true);
      setSwipeOffset(0);
    }
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    touchCurrent.current = { x: touch.clientX, y: touch.clientY };

    if (isSwipingBack) {
      const deltaX = touch.clientX - touchStart.current.x;
      if (deltaX > 0) {
        setSwipeOffset(deltaX);
        e.preventDefault(); // Prevent standard page scroll/bounce on swipe track
      }
    }
  };

  const handleTouchEnd = () => {
    if (isSwipingBack) {
      setIsSwipingBack(false);
      const deltaX = touchCurrent.current.x - touchStart.current.x;
      
      if (deltaX > 150) {
        // Successful dismiss swipe: animate off-screen and go back
        setSwipeOffset(window.innerWidth);
        setTimeout(() => {
          router.back();
          setSwipeOffset(0);
        }, 200);
      } else {
        // Cancelled swipe: snap back cleanly
        setSwipeOffset(0);
      }
    }
  };

  // Sheet swipe handlers
  const handleSheetTouchStart = (e) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    touchCurrent.current = { x: touch.clientX, y: touch.clientY };
    setIsSwipingSheet(true);
    setSheetOffset(0);
  };

  const handleSheetTouchMove = (e) => {
    if (!isSwipingSheet) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStart.current.y;
    if (deltaY > 0) {
      setSheetOffset(deltaY);
      e.preventDefault();
    }
  };

  const handleSheetTouchEnd = () => {
    if (!isSwipingSheet) return;
    setIsSwipingSheet(false);
    const deltaY = touchCurrent.current.y - touchStart.current.y;
    if (deltaY > 150) {
      // Successful downward swipe: slide completely off and close
      setSheetOffset(window.innerHeight);
      setTimeout(() => {
        setShowNewPostSheet(false);
        setSheetOffset(0);
      }, 300);
    } else {
      // Cancelled downward swipe: spring back
      setSheetOffset(0);
    }
  };

  // Dynamic parallax styles
  const mainContentStyle = isSwipingBack ? {
    transform: `translateX(${swipeOffset}px)`,
    transition: 'none',
    boxShadow: '0 0 40px rgba(0,0,0,0.5)',
    zIndex: 100,
    backgroundColor: 'var(--bg-base)'
  } : {
    transform: 'translateX(0px)',
    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
  };

  // Synced background view movements (Parallax effect)
  const backgroundParallaxStyle = isSwipingBack ? {
    transform: `translateX(${-30 + swipeOffset * 0.35}px)`,
    opacity: 0.75 + (swipeOffset / (window.innerWidth || 375)) * 0.25,
    transition: 'none'
  } : {};

  // Background Scaling & Dimming calculation
  let bgScale = 1;
  let bgBrightness = 1;
  let bgBorderRadius = '0px';

  if (showNewPostSheet) {
    const sheetHeight = 600;
    const progress = Math.min(1, sheetOffset / sheetHeight);
    
    bgScale = 0.95 + 0.05 * progress;
    bgBrightness = 0.5 + 0.5 * progress;
    bgBorderRadius = `${24 * (1 - progress)}px`;
  }

  const containerStyle = showNewPostSheet ? {
    transform: `scale(${bgScale})`,
    filter: `brightness(${bgBrightness})`,
    borderRadius: bgBorderRadius,
    overflow: 'hidden',
    transition: isSwipingSheet ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s ease, border-radius 0.4s ease',
    boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
  } : {};

  return (
    <div 
      className="gesture-wrapper" 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        display: 'flex', 
        width: '100%', 
        height: '100vh', 
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Scaling Dashboard Container */}
      <div style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        ...containerStyle
      }}>
        {/* Parallax Sidebar underlays */}
        <div style={{ height: '100%', ...backgroundParallaxStyle }}>
          {injectedSidebar}
        </div>
        
        {/* Sliding Main Content Page */}
        <div style={{ 
          flex: 1, 
          minWidth: 0,
          height: '100%',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          ...mainContentStyle 
        }}>
          {mainContentChild}
        </div>
      </div>

      {/* Swipe Back Shadows */}
      {isSwipingBack && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '15px',
          background: 'linear-gradient(to right, rgba(0,0,0,0.3), transparent)',
          transform: `translateX(${swipeOffset}px)`,
          zIndex: 99,
          pointerEvents: 'none'
        }} />
      )}

      {/* Sliding swipable bottom sheet wrapper */}
      {showNewPostSheet && (
        <div className="mobile-bottom-sheet-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: `rgba(0, 0, 0, ${0.6 * (1 - (sheetOffset / 600))})`,
          backdropFilter: `blur(${8 * (1 - (sheetOffset / 600))}px)`,
          WebkitBackdropFilter: `blur(${8 * (1 - (sheetOffset / 600))}px)`,
          zIndex: 2000,
          transition: isSwipingSheet ? 'none' : 'background-color 0.4s ease, backdrop-filter 0.4s ease',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }} onClick={() => {
          setSheetOffset(window.innerHeight);
          setTimeout(() => {
            setShowNewPostSheet(false);
            setSheetOffset(0);
          }, 300);
        }}>
          <div className="mobile-bottom-sheet" style={{
            width: '100%',
            maxWidth: '600px',
            backgroundColor: 'var(--bg-card)',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            border: '1px solid var(--border)',
            borderBottom: 'none',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
            transform: `translateY(${isSwipingSheet ? sheetOffset : 0}px)`,
            transition: isSwipingSheet ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Grab drag-to-dismiss handle bar */}
            <div 
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
              style={{
                width: '100%',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'grab',
                userSelect: 'none',
                flexShrink: 0,
                borderBottom: '1px solid rgba(255,255,255,0.02)'
              }}
            >
              <div style={{
                width: '40px',
                height: '6px',
                borderRadius: '3px',
                backgroundColor: 'var(--text-muted)',
                opacity: 0.5
              }} />
            </div>

            {/* Render full post-creation component inside sheet content viewport */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 40px' }}>
              <NewPost />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
