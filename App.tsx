import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AtmosphereCanvas } from './components/AtmosphereCanvas';
import { ClockCenterpiece } from './components/ClockCenterpiece';
import { FloatingChrome } from './components/FloatingChrome';
import { AIDirectorPanel } from './components/panels/AIDirectorPanel';
import { BreathingModal } from './components/panels/BreathingModal';
import { FocusGalaxyStatsPanel } from './components/panels/FocusGalaxyStatsPanel';
import { OnboardingAndLandingModal } from './components/panels/OnboardingAndLandingModal';
import { ScenesAndPresetsPanel } from './components/panels/ScenesAndPresetsPanel';
import { SessionCompleteOverlay } from './components/panels/SessionCompleteOverlay';
import { SettingsAndShortcutsModal } from './components/panels/SettingsAndShortcutsModal';
import { SoundMixerPanel } from './components/panels/SoundMixerPanel';
import { auraActions, useAuraStore } from './store/useAuraStore';

export function App() {
  const state = useAuraStore();
  const { activeModal, visualConfig, masterVolume, audioInitialized } = state;

  const [controlsVisible, setControlsVisible] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);

  const hideTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const showToast = useCallback((label: string) => {
    setShortcutToast(label);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setShortcutToast(null);
    }, 1600);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (!visualConfig.autoHideControls) return;
    hideTimerRef.current = window.setTimeout(() => {
      if (useAuraStoreForCheck().activeModal === null) {
        setControlsVisible(false);
      }
    }, 4000);
  }, [visualConfig.autoHideControls]);

  // Helper to read current modal state in timeout
  const stateRef = useRef(state);
  stateRef.current = state;
  function useAuraStoreForCheck() {
    return stateRef.current;
  }

  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [resetInactivityTimer, activeModal]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    resetInactivityTimer();
    const nx = e.clientX / Math.max(1, window.innerWidth);
    const ny = e.clientY / Math.max(1, window.innerHeight);
    setMousePos({ x: nx, y: ny });
  };

  const handleFirstInteraction = () => {
    if (!audioInitialized) {
      auraActions.ensureAudioUnlocked();
    }
    resetInactivityTimer();
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
      showToast('Fullscreen Sanctuary');
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
      showToast('Windowed Mode');
    }
  }, [showToast]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetInactivityTimer();

      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (e.key === 'Escape') {
        auraActions.setActiveModal(null);
        return;
      }

      if (isInput) return;

      const key = e.key.toLowerCase();
      if (e.code === 'Space') {
        e.preventDefault();
        auraActions.togglePauseSession();
        showToast(stateRef.current.isSessionActive && !stateRef.current.isSessionPaused ? 'Session Paused' : 'Focus Active');
      } else if (key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (key === 'm') {
        e.preventDefault();
        auraActions.toggleMute();
        showToast(stateRef.current.isMuted ? 'Audio Unmuted' : 'Audio Muted');
      } else if (key === 's') {
        e.preventDefault();
        auraActions.setActiveModal(stateRef.current.activeModal === 'sounds' ? null : 'sounds');
      } else if (key === 'a') {
        e.preventDefault();
        auraActions.setActiveModal(stateRef.current.activeModal === 'scenes' ? null : 'scenes');
      } else if (key === 'd') {
        e.preventDefault();
        auraActions.setActiveModal(stateRef.current.activeModal === 'director' ? null : 'director');
      } else if (key === 'b') {
        e.preventDefault();
        auraActions.setActiveModal(stateRef.current.activeModal === 'breathing' ? null : 'breathing');
      } else if (key === 'g' || key === 't') {
        e.preventDefault();
        auraActions.setActiveModal(stateRef.current.activeModal === 'stats' ? null : 'stats');
      } else if (key === 'r') {
        e.preventDefault();
        auraActions.resetSession();
        showToast('Timer Reset');
      } else if (e.key === '?' || e.key === '/') {
        e.preventDefault();
        auraActions.setActiveModal(stateRef.current.activeModal === 'shortcuts' ? null : 'shortcuts');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const next = Math.min(1, stateRef.current.masterVolume + 0.05);
        auraActions.setMasterVolume(next);
        showToast(`Volume ${Math.round(next * 100)}%`);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.max(0, stateRef.current.masterVolume - 0.05);
        auraActions.setMasterVolume(next);
        showToast(`Volume ${Math.round(next * 100)}%`);
      } else if (e.shiftKey && key === 'e') {
        e.preventDefault();
        auraActions.unlockEasterEggScene();
        showToast('Solaris Eclipse Unlocked');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetInactivityTimer, showToast, toggleFullscreen]);

  // Mobile swipe gestures (Swipe up = open scenes, Swipe down = close panel / hide controls)
  const handleTouchStart = (e: React.TouchEvent) => {
    handleFirstInteraction();
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const endY = e.changedTouches[0]?.clientY ?? touchStartYRef.current;
    const deltaY = touchStartYRef.current - endY;
    if (Math.abs(deltaY) > 65) {
      if (deltaY > 0 && activeModal === null) {
        auraActions.setActiveModal('scenes');
      } else if (deltaY < 0 && activeModal !== null) {
        auraActions.setActiveModal(null);
      }
    }
    touchStartYRef.current = null;
  };

  return (
    <main
      onPointerMove={handlePointerMove}
      onPointerDown={handleFirstInteraction}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative w-screen h-screen overflow-hidden flex items-center justify-center bg-[#08090B] text-[#F5F2EA] ${
        !controlsVisible && activeModal === null ? 'cursor-none' : ''
      }`}
    >
      {/* Multi-Layered Living Atmosphere & Particle Engine */}
      <AtmosphereCanvas mousePos={mousePos} />

      {/* Top Navigation & Auto-Hiding Bottom Control Dock */}
      <FloatingChrome
        controlsVisible={controlsVisible}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
      />

      {/* Primary Focal Point: The Clock & Active Focus Session Centerpiece */}
      <div
        onClick={() => {
          if (activeModal !== null) {
            auraActions.setActiveModal(null);
          }
        }}
        className="relative z-10 w-full h-full flex items-center justify-center"
      >
        <ClockCenterpiece controlsVisible={controlsVisible} />
      </div>

      {/* Subtle Keyboard Shortcut Feedback Pill */}
      <AnimatePresence>
        {shortcutToast && (
          <motion.div
            key={shortcutToast}
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
            transition={{ duration: 0.25 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-[#101114]/90 border border-[#F5F2EA]/15 text-[11px] tracking-[0.2em] uppercase text-[#F5F2EA] pointer-events-none"
          >
            {shortcutToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergent Architectural Panels & Modals */}
      <AnimatePresence mode="wait">
        {activeModal === 'scenes' && <ScenesAndPresetsPanel key="scenes-panel" />}
        {activeModal === 'sounds' && <SoundMixerPanel key="sounds-panel" />}
        {activeModal === 'director' && <AIDirectorPanel key="director-panel" />}
        {activeModal === 'stats' && <FocusGalaxyStatsPanel key="stats-panel" />}
        {activeModal === 'breathing' && <BreathingModal key="breathing-modal" />}
        {(activeModal === 'settings' || activeModal === 'shortcuts') && (
          <SettingsAndShortcutsModal key="settings-modal" />
        )}
        {(activeModal === 'onboarding' || activeModal === 'landing') && (
          <OnboardingAndLandingModal key="onboarding-modal" />
        )}
      </AnimatePresence>

      {/* Session Completion Sequence Overlay */}
      <AnimatePresence>
        <SessionCompleteOverlay />
      </AnimatePresence>
    </main>
  );
}

export default App;
