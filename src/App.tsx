/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { ImageViewer } from './components/ImageViewer';
import { Sidebar } from './components/Sidebar';
import { ExportModal } from './components/ExportModal';
import { 
  INSPECTION_IMAGES, 
  PAGE_GROUPS, 
  INITIAL_ANNOTATIONS, 
  INITIAL_OBSERVATIONS 
} from './data/inspectionData';
import { 
  Annotation, 
  AnnotationTool, 
  InspectionImage, 
  Observation 
} from './types/inspection';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState(true);

  // Active inspection image (default to container truck from screenshot)
  const defaultImage = INSPECTION_IMAGES.find((img) => img.id === 'img-p3-03') || INSPECTION_IMAGES[0];
  const [currentImage, setCurrentImage] = useState<InspectionImage>(defaultImage);

  // Annotations mapped by image ID
  const [annotationsMap, setAnnotationsMap] = useState<Record<string, Annotation[]>>(INITIAL_ANNOTATIONS);

  // Observations list
  const [observations, setObservations] = useState<Observation[]>(INITIAL_OBSERVATIONS);

  // Active drawing tool
  const [activeTool, setActiveTool] = useState<AnnotationTool>(null);
  const [currentColor, setCurrentColor] = useState('#3b82f6'); // SIA Blue

  // Optical enhancement mode
  const [contrastMode, setContrastMode] = useState<'normal' | 'contrast' | 'brightness' | 'invert'>('normal');

  // Sidebar active tab & responsive open state
  const [activeSidebarTab, setActiveSidebarTab] = useState<'images' | 'observations'>('images');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auto-tour (slideshow)
  const [isAutoTour, setIsAutoTour] = useState(false);
  const [autoTourProgress, setAutoTourProgress] = useState(0);

  // Export Modal
  const [exportModalState, setExportModalState] = useState<{
    isOpen: boolean;
    type: 'all' | 'current';
  }>({ isOpen: false, type: 'all' });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Synchronize dark mode class on document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Current image annotations
  const currentAnnotations = annotationsMap[currentImage.id] || [];

  // Navigation indices
  const currentIndex = INSPECTION_IMAGES.findIndex((img) => img.id === currentImage.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < INSPECTION_IMAGES.length - 1;

  const handlePrevImage = useCallback(() => {
    if (hasPrev) {
      setCurrentImage(INSPECTION_IMAGES[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex]);

  const handleNextImage = useCallback(() => {
    if (hasNext) {
      setCurrentImage(INSPECTION_IMAGES[currentIndex + 1]);
    } else if (isAutoTour) {
      // Loop back to start in tour
      setCurrentImage(INSPECTION_IMAGES[0]);
    }
  }, [hasNext, currentIndex, isAutoTour]);

  // Auto-tour interval logic
  useEffect(() => {
    if (!isAutoTour) {
      setAutoTourProgress(0);
      return;
    }

    const duration = 4000; // 4 seconds per slide
    const intervalTime = 100;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setAutoTourProgress((prev) => {
        if (prev >= 100) {
          handleNextImage();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isAutoTour, handleNextImage]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === 'Escape') {
        setActiveTool(null);
        setExportModalState({ isOpen: false, type: 'all' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevImage, handleNextImage]);

  // Annotation handlers
  const handleAddAnnotation = (annotation: Annotation) => {
    setAnnotationsMap((prev) => ({
      ...prev,
      [currentImage.id]: [...(prev[currentImage.id] || []), annotation],
    }));
    showToast(`FIGURA "${annotation.label || 'DETALLE'}" GUARDADA EN LA IMAGEN`);
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotationsMap((prev) => ({
      ...prev,
      [currentImage.id]: (prev[currentImage.id] || []).filter((a) => a.id !== id),
    }));
    showToast('FIGURA ELIMINADA');
  };

  const handleUndoAnnotation = () => {
    setAnnotationsMap((prev) => {
      const currentList = prev[currentImage.id] || [];
      if (currentList.length === 0) return prev;
      return {
        ...prev,
        [currentImage.id]: currentList.slice(0, -1),
      };
    });
    showToast('ULTIMO TRAZO DESHECHO');
  };

  const handleClearAnnotations = () => {
    setAnnotationsMap((prev) => ({
      ...prev,
      [currentImage.id]: [],
    }));
    showToast('FIGURAS LIMPIADAS EN ESTA IMAGEN');
  };

  // Add observation handler
  const handleAddObservation = (newObs: Omit<Observation, 'id' | 'timestamp'>) => {
    const observationWithMeta: Observation = {
      ...newObs,
      id: `obs-${Date.now()}`,
      timestamp: 'AHORA MISMO',
      avatarColor: '#3b82f6',
      reactions: { '👍': 1 },
      userReacted: ['👍'],
      isAuditorVerified: false,
    };
    setObservations((prev) => [observationWithMeta, ...prev]);
    showToast('OBSERVACION REGISTRADA EN EL CHAT EN VIVO');
  };

  // Toggle reaction on an observation (Facebook / Messenger style)
  const handleToggleReaction = (obsId: string, emoji: string) => {
    setObservations((prev) =>
      prev.map((obs) => {
        if (obs.id !== obsId) return obs;
        const currentReactions = { ...(obs.reactions || {}) };
        const userReacted = [...(obs.userReacted || [])];
        const hasReacted = userReacted.includes(emoji);

        if (hasReacted) {
          const updatedCount = (currentReactions[emoji] || 1) - 1;
          if (updatedCount <= 0) {
            delete currentReactions[emoji];
          } else {
            currentReactions[emoji] = updatedCount;
          }
          return {
            ...obs,
            reactions: currentReactions,
            userReacted: userReacted.filter((e) => e !== emoji),
          };
        } else {
          currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
          userReacted.push(emoji);
          return {
            ...obs,
            reactions: currentReactions,
            userReacted,
          };
        }
      })
    );
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className={`w-screen h-screen flex flex-col bg-[#06080d] text-neutral-100 overflow-hidden font-sans relative ${isDark ? 'dark' : ''}`}>
      {/* Sleek Top Navigation Bar */}
      <TopBar
        currentImage={currentImage}
        totalImagesCount={INSPECTION_IMAGES.length}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        currentColor={currentColor}
        setCurrentColor={setCurrentColor}
        onDownloadCurrent={() => setExportModalState({ isOpen: true, type: 'current' })}
        onDownloadAll={() => setExportModalState({ isOpen: true, type: 'all' })}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        contrastMode={contrastMode}
        setContrastMode={setContrastMode}
        onToggleFullscreen={handleToggleFullscreen}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Workspace: Left Central Viewer + Right Thumbnails/Observations Panel */}
      <div className="flex-1 flex min-h-0 relative">
        <ImageViewer
          image={currentImage}
          annotations={currentAnnotations}
          activeTool={activeTool}
          currentColor={currentColor}
          onAddAnnotation={handleAddAnnotation}
          onDeleteAnnotation={handleDeleteAnnotation}
          onUndoAnnotation={handleUndoAnnotation}
          onClearAnnotations={handleClearAnnotations}
          onPrevImage={handlePrevImage}
          onNextImage={handleNextImage}
          hasPrev={hasPrev}
          hasNext={hasNext}
          contrastMode={contrastMode}
          isAutoTour={isAutoTour}
          onToggleAutoTour={() => setIsAutoTour(!isAutoTour)}
          autoTourProgress={autoTourProgress}
        />

        <Sidebar
          pageGroups={PAGE_GROUPS}
          allImages={INSPECTION_IMAGES}
          currentImage={currentImage}
          onSelectImage={(img) => {
            setCurrentImage(img);
            if (isAutoTour) setIsAutoTour(false);
          }}
          observations={observations}
          onAddObservation={handleAddObservation}
          onToggleReaction={handleToggleReaction}
          activeSidebarTab={activeSidebarTab}
          setActiveSidebarTab={setActiveSidebarTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModalState.isOpen}
        onClose={() => setExportModalState({ isOpen: false, type: 'all' })}
        totalImages={INSPECTION_IMAGES.length}
        observationsCount={observations.length}
        currentImage={currentImage}
        exportType={exportModalState.type}
      />

      {/* Toast Feedback Notification (Flat, Crisp, No Shadow) */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0d121c] border border-blue-500/70 text-white text-xs font-mono font-bold px-4 py-2 rounded-full flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 uppercase tracking-wider">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
