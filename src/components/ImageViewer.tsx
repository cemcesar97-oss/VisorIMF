import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Minus, 
  RotateCw, 
  Maximize, 
  Grid, 
  Eye, 
  EyeOff, 
  Undo2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Sparkles,
  Tag,
  Check,
  X
} from 'lucide-react';
import { Annotation, AnnotationTool, InspectionImage, Point } from '../types/inspection';

interface ImageViewerProps {
  image: InspectionImage;
  annotations: Annotation[];
  activeTool: AnnotationTool;
  currentColor: string;
  onAddAnnotation: (annotation: Annotation) => void;
  onDeleteAnnotation: (id: string) => void;
  onUndoAnnotation: () => void;
  onClearAnnotations: () => void;
  onPrevImage: () => void;
  onNextImage: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  contrastMode: 'normal' | 'contrast' | 'brightness' | 'invert';
  isAutoTour: boolean;
  onToggleAutoTour: () => void;
  autoTourProgress: number; // 0 to 100
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  image,
  annotations,
  activeTool,
  currentColor,
  onAddAnnotation,
  onDeleteAnnotation,
  onUndoAnnotation,
  onClearAnnotations,
  onPrevImage,
  onNextImage,
  hasPrev,
  hasNext,
  contrastMode,
  isAutoTour,
  onToggleAutoTour,
  autoTourProgress,
}) => {
  // Viewport transforms
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Display toggles
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  // Drawing state (all coordinates normalized 0 to 100%)
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [currentMouse, setCurrentMouse] = useState<Point | null>(null);
  const [penPath, setPenPath] = useState<Point[]>([]);

  // Prompt for label modal
  const [pendingAnnotation, setPendingAnnotation] = useState<Partial<Annotation> | null>(null);
  const [labelInput, setLabelInput] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset transforms when image changes
  useEffect(() => {
    setImageLoaded(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setSelectedAnnotationId(null);
  }, [image.id]);

  // Handle zoom in/out with limits
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (activeTool && activeTool !== 'select') return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.5), 4));
  };

  // Convert mouse event coordinates to percentage (0 - 100) relative to image container
  const getRelativeCoords = useCallback((e: React.MouseEvent): Point | null => {
    if (!imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  }, []);

  // Drawing event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    if (activeTool && activeTool !== 'select') {
      const coords = getRelativeCoords(e);
      if (!coords) return;

      setIsDrawing(true);
      setDrawStart(coords);
      setCurrentMouse(coords);

      if (activeTool === 'pen') {
        setPenPath([coords]);
      }
    } else if (zoom > 1) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawing && activeTool) {
      const coords = getRelativeCoords(e);
      if (!coords) return;
      setCurrentMouse(coords);

      if (activeTool === 'pen') {
        setPenPath((prev) => [...prev, coords]);
      }
    } else if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && activeTool && activeTool !== 'select' && drawStart && currentMouse) {
      setIsDrawing(false);

      let newAnnotation: Partial<Annotation> = {
        id: `ann-${Date.now()}`,
        imageId: image.id,
        tool: activeTool,
        color: currentColor,
        strokeWidth: 2,
        createdAt: new Date().toLocaleTimeString(),
      };

      if (activeTool === 'rect') {
        const left = Math.min(drawStart.x, currentMouse.x);
        const top = Math.min(drawStart.y, currentMouse.y);
        const width = Math.abs(currentMouse.x - drawStart.x);
        const height = Math.abs(currentMouse.y - drawStart.y);

        if (width > 1.5 && height > 1.5) {
          newAnnotation = { ...newAnnotation, x: left, y: top, width, height };
          setPendingAnnotation(newAnnotation);
          setLabelInput('');
        }
      } else if (activeTool === 'circle' || activeTool === 'oval') {
        const left = Math.min(drawStart.x, currentMouse.x);
        const top = Math.min(drawStart.y, currentMouse.y);
        const width = Math.abs(currentMouse.x - drawStart.x);
        const height = activeTool === 'circle' ? width : Math.abs(currentMouse.y - drawStart.y);

        if (width > 1.5) {
          newAnnotation = { ...newAnnotation, x: left, y: top, width, height };
          setPendingAnnotation(newAnnotation);
          setLabelInput('');
        }
      } else if (activeTool === 'arrow') {
        const dist = Math.hypot(currentMouse.x - drawStart.x, currentMouse.y - drawStart.y);
        if (dist > 2) {
          newAnnotation = {
            ...newAnnotation,
            x: drawStart.x,
            y: drawStart.y,
            endPoint: currentMouse,
          };
          setPendingAnnotation(newAnnotation);
          setLabelInput('');
        }
      } else if (activeTool === 'pen') {
        if (penPath.length > 2) {
          newAnnotation = {
            ...newAnnotation,
            x: penPath[0].x,
            y: penPath[0].y,
            points: penPath,
          };
          setPendingAnnotation(newAnnotation);
          setLabelInput('');
        }
      }

      setDrawStart(null);
      setCurrentMouse(null);
      setPenPath([]);
    }

    if (isPanning) {
      setIsPanning(false);
    }
  };

  const confirmPendingAnnotation = (defaultLabel?: string) => {
    if (pendingAnnotation) {
      const finalAnnotation: Annotation = {
        ...(pendingAnnotation as Annotation),
        label: labelInput.trim() || defaultLabel || 'Detalle verificado',
      };
      onAddAnnotation(finalAnnotation);
      setPendingAnnotation(null);
      setLabelInput('');
    }
  };

  // Get image CSS filter
  const getFilterStyle = () => {
    switch (contrastMode) {
      case 'contrast':
        return 'contrast(165%) brightness(105%) saturate(120%)';
      case 'brightness':
        return 'brightness(135%) contrast(115%)';
      case 'invert':
        return 'invert(100%) hue-rotate(180deg) contrast(110%)';
      default:
        return 'none';
    }
  };

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative flex-1 h-full bg-[#06080d] overflow-hidden flex items-center justify-center select-none"
      style={{
        cursor: activeTool ? 'crosshair' : zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
      }}
    >
      {/* Background Dot Matrix Texture matching imagen_1838375a.png */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.14) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Precision CAD Corner Markers (ReactBits Engineering Aesthetic) */}
      <div className="absolute top-2.5 left-12 text-neutral-700 font-mono text-xs select-none pointer-events-none">+</div>
      <div className="absolute top-2.5 right-3 text-neutral-700 font-mono text-xs select-none pointer-events-none">+</div>
      <div className="absolute bottom-11 left-12 text-neutral-700 font-mono text-xs select-none pointer-events-none">+</div>
      <div className="absolute bottom-11 right-3 text-neutral-700 font-mono text-xs select-none pointer-events-none">+</div>

      {/* Discreet Technical Inspection HUD (Bottom Left) */}
      <div className="absolute bottom-2.5 left-12 z-20 hidden md:flex items-center gap-2 px-2.5 py-1 bg-[#090b10]/95 border border-neutral-800 rounded-md text-[9px] font-mono text-neutral-400 select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="text-neutral-200 font-bold uppercase">{image.dimensions}</span>
        <span className="text-neutral-700">|</span>
        <span className="uppercase text-neutral-400">{image.timestamp}</span>
        <span className="text-neutral-700">|</span>
        <span className="text-blue-400 font-bold uppercase">QA AQL-II</span>
      </div>

      {/* Floating Vertical Tool Dock (Compact Figma Buttons, Flat, No Shadows) */}
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center bg-[#0a0d14] border border-neutral-800 rounded-lg p-1 gap-1 text-neutral-300">
        <button
          onClick={handleZoomIn}
          className="w-7 h-7 rounded-md hover:bg-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
          title="ACERCAR (+)"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleResetZoom}
          className="w-7 py-0.5 rounded text-[10px] font-mono font-bold hover:bg-neutral-800 flex items-center justify-center text-blue-400 transition-colors"
          title="RESTABLECER ZOOM A 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={handleZoomOut}
          className="w-7 h-7 rounded-md hover:bg-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
          title="ALEJAR (-)"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="w-4 h-px bg-neutral-800 my-0.5" />

        <button
          onClick={handleResetZoom}
          className="w-7 h-7 rounded-md hover:bg-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
          title="AJUSTAR A PANTALLA"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleRotate}
          className="w-7 h-7 rounded-md hover:bg-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white transition-colors"
          title="ROTAR 90 (R)"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
            showGrid ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' : 'hover:bg-neutral-800 text-neutral-400'
          }`}
          title="REJILLA DE INSPECCION MILIMETRICA"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        <div className="w-4 h-px bg-neutral-800 my-0.5" />

        <button
          onClick={() => setShowAnnotations(!showAnnotations)}
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
            showAnnotations ? 'text-blue-400 hover:bg-neutral-800' : 'text-neutral-500 hover:bg-neutral-800'
          }`}
          title={showAnnotations ? 'OCULTAR FIGURAS DE DETALLE' : 'MOSTRAR FIGURAS DE DETALLE'}
        >
          {showAnnotations ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        {annotations.length > 0 && (
          <>
            <button
              onClick={onUndoAnnotation}
              className="w-7 h-7 rounded-md hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-amber-400 transition-colors"
              title="DESHACER ULTIMA FIGURA"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClearAnnotations}
              className="w-7 h-7 rounded-md hover:bg-rose-950/40 flex items-center justify-center text-neutral-400 hover:text-rose-400 transition-colors"
              title="LIMPIAR TODAS LAS FIGURAS EN ESTA IMAGEN"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Selected Annotation Actions Dock (Flat, Crisp, No Shadows) */}
      {selectedAnnotationId && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#0e1118] border border-blue-500/60 rounded-full pl-3.5 pr-2 py-1 flex items-center gap-2.5 z-30 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: annotations.find((a) => a.id === selectedAnnotationId)?.color || '#3b82f6' }} />
            <span className="text-[11px] font-mono font-black text-white uppercase tracking-wider">
              {annotations.find((a) => a.id === selectedAnnotationId)?.label || 'FIGURA SELECCIONADA'}
            </span>
          </div>
          <div className="h-3.5 w-px bg-neutral-700" />
          <button
            onClick={() => {
              onDeleteAnnotation(selectedAnnotationId);
              setSelectedAnnotationId(null);
            }}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase text-rose-400 hover:bg-rose-950/60 rounded-full transition-colors"
            title="ELIMINAR FIGURA"
          >
            <Trash2 className="w-3 h-3" />
            <span>ELIMINAR</span>
          </button>
          <button
            onClick={() => setSelectedAnnotationId(null)}
            className="w-5 h-5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
            title="CERRAR SELECCION"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Image Viewport Area */}
      <div 
        className="relative transition-transform duration-75 ease-out select-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
          transformOrigin: 'center center',
          maxHeight: '85vh',
          maxWidth: '85vw',
        }}
      >
        {/* ReactBits Pro Forensic Skeleton Loader */}
        {!imageLoaded && (
          <div className="w-[780px] h-[540px] max-w-[85vw] max-h-[78vh] rounded-lg bg-[#0a0d15] border border-neutral-800 relative overflow-hidden flex flex-col justify-between p-6 select-none">
            {/* Shimmer wave effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-shimmer pointer-events-none" />

            {/* Corner CAD crosshairs */}
            <div className="absolute top-2 left-2 text-neutral-600 font-mono text-[10px] leading-none select-none">+</div>
            <div className="absolute top-2 right-2 text-neutral-600 font-mono text-[10px] leading-none select-none">+</div>
            <div className="absolute bottom-2 left-2 text-neutral-600 font-mono text-[10px] leading-none select-none">+</div>
            <div className="absolute bottom-2 right-2 text-neutral-600 font-mono text-[10px] leading-none select-none">+</div>

            {/* Top Skeleton Metadata Row */}
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3 relative z-10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-mono text-[10px] font-black text-neutral-300 uppercase tracking-wider">
                  SIA ENGINE · SINCRONIZANDO FOTOGRAMA #{image.indexInPage}
                </span>
              </div>
              <span className="font-mono text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                PAGINA {image.page}
              </span>
            </div>

            {/* Center Reticle & Scanner Sweep */}
            <div className="flex flex-col items-center justify-center gap-3 relative z-10 my-auto">
              <div className="relative w-14 h-14 rounded-full border border-neutral-800 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-blue-500/30 border-t-blue-500 animate-spin" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <div className="absolute inset-x-0 top-1/2 h-px bg-neutral-800" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-neutral-800" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[11px] font-mono font-black text-neutral-200 uppercase tracking-widest">
                  DECODIFICANDO CAPTURA FORENSE
                </span>
                <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider">
                  RESOLUCION {image.dimensions} · NORMATIVA AQL II
                </span>
              </div>
            </div>

            {/* Bottom Skeleton Placeholders */}
            <div className="flex items-center justify-between border-t border-neutral-800/80 pt-3 relative z-10 text-[9px] font-mono text-neutral-500 uppercase font-bold">
              <span>EXPEDIENTE QA-CN-2026-8868</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                <span>SHA-256 S3 SYNC</span>
              </span>
            </div>
          </div>
        )}

        {/* Inspection Image (Flat, Clean, No Shadow) */}
        <img
          ref={imageRef}
          src={image.src}
          alt={image.title}
          onLoad={() => setImageLoaded(true)}
          draggable={false}
          className={`max-h-[82vh] max-w-[82vw] object-contain rounded-lg transition-opacity duration-200 pointer-events-auto border border-neutral-800 ${
            imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
          }`}
          style={{
            filter: getFilterStyle(),
          }}
        />

        {/* Milimetric Quality Inspection Grid Overlay */}
        {showGrid && imageLoaded && (
          <div 
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(59, 130, 246, 0.15) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(59, 130, 246, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          >
            <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-500/30" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-500/30" />
          </div>
        )}

        {/* High-Precision Vector SVG Layer (Coordinates scaled 0..1000) */}
        {imageLoaded && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible rounded-lg"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
          >
            <defs>
              <marker
                id="arrowhead-live"
                markerWidth="10"
                markerHeight="8"
                refX="8"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 8 4, 0 8" fill={currentColor} />
              </marker>
              {annotations.map((ann) => (
                <marker
                  key={`marker-${ann.id}`}
                  id={`arrow-${ann.id}`}
                  markerWidth="10"
                  markerHeight="8"
                  refX="8"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 0, 8 4, 0 8" fill={ann.color} />
                </marker>
              ))}
            </defs>

            {/* Saved Shapes */}
            {showAnnotations &&
              annotations.map((ann) => {
                const isSelected = selectedAnnotationId === ann.id;
                const sx = ann.x * 10;
                const sy = ann.y * 10;
                const sw = (ann.width || 0) * 10;
                const sh = (ann.height || 0) * 10;

                return (
                  <g 
                    key={ann.id} 
                    className="cursor-pointer pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAnnotationId(isSelected ? null : ann.id);
                    }}
                  >
                    {ann.tool === 'rect' && (
                      <rect
                        x={sx}
                        y={sy}
                        width={sw}
                        height={sh}
                        fill={`${ann.color}18`}
                        stroke={ann.color}
                        strokeWidth={isSelected ? 4 : 2.5}
                        strokeDasharray={isSelected ? '6,6' : 'none'}
                        className="transition-all hover:fill-opacity-30"
                      />
                    )}

                    {(ann.tool === 'circle' || ann.tool === 'oval') && (
                      <ellipse
                        cx={sx + sw / 2}
                        cy={sy + sh / 2}
                        rx={sw / 2}
                        ry={sh / 2}
                        fill={`${ann.color}18`}
                        stroke={ann.color}
                        strokeWidth={isSelected ? 4 : 2.5}
                        className="transition-all hover:fill-opacity-30"
                      />
                    )}

                    {ann.tool === 'arrow' && ann.endPoint && (
                      <line
                        x1={sx}
                        y1={sy}
                        x2={ann.endPoint.x * 10}
                        y2={ann.endPoint.y * 10}
                        stroke={ann.color}
                        strokeWidth={3}
                        markerEnd={`url(#arrow-${ann.id})`}
                      />
                    )}

                    {ann.tool === 'pen' && ann.points && ann.points.length > 1 && (
                      <path
                        d={ann.points.reduce(
                          (acc, p, idx) => (idx === 0 ? `M ${p.x * 10} ${p.y * 10}` : `${acc} L ${p.x * 10} ${p.y * 10}`),
                          ''
                        )}
                        fill="none"
                        stroke={ann.color}
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </g>
                );
              })}

            {/* Currently Drawing Shape Preview */}
            {isDrawing && drawStart && currentMouse && (
              <g className="pointer-events-none">
                {activeTool === 'rect' && (
                  <rect
                    x={Math.min(drawStart.x, currentMouse.x) * 10}
                    y={Math.min(drawStart.y, currentMouse.y) * 10}
                    width={Math.abs(currentMouse.x - drawStart.x) * 10}
                    height={Math.abs(currentMouse.y - drawStart.y) * 10}
                    fill={`${currentColor}20`}
                    stroke={currentColor}
                    strokeWidth={2.5}
                    strokeDasharray="6,6"
                  />
                )}

                {activeTool === 'circle' && (
                  <ellipse
                    cx={(Math.min(drawStart.x, currentMouse.x) + Math.abs(currentMouse.x - drawStart.x) / 2) * 10}
                    cy={(Math.min(drawStart.y, currentMouse.y) + Math.abs(currentMouse.x - drawStart.x) / 2) * 10}
                    rx={(Math.abs(currentMouse.x - drawStart.x) / 2) * 10}
                    ry={(Math.abs(currentMouse.x - drawStart.x) / 2) * 10}
                    fill={`${currentColor}20`}
                    stroke={currentColor}
                    strokeWidth={2.5}
                  />
                )}

                {activeTool === 'oval' && (
                  <ellipse
                    cx={(Math.min(drawStart.x, currentMouse.x) + Math.abs(currentMouse.x - drawStart.x) / 2) * 10}
                    cy={(Math.min(drawStart.y, currentMouse.y) + Math.abs(currentMouse.y - drawStart.y) / 2) * 10}
                    rx={(Math.abs(currentMouse.x - drawStart.x) / 2) * 10}
                    ry={(Math.abs(currentMouse.y - drawStart.y) / 2) * 10}
                    fill={`${currentColor}20`}
                    stroke={currentColor}
                    strokeWidth={2.5}
                  />
                )}

                {activeTool === 'arrow' && (
                  <line
                    x1={drawStart.x * 10}
                    y1={drawStart.y * 10}
                    x2={currentMouse.x * 10}
                    y2={currentMouse.y * 10}
                    stroke={currentColor}
                    strokeWidth={3}
                    markerEnd="url(#arrowhead-live)"
                  />
                )}

                {activeTool === 'pen' && penPath.length > 1 && (
                  <path
                    d={penPath.reduce(
                      (acc, p, idx) => (idx === 0 ? `M ${p.x * 10} ${p.y * 10}` : `${acc} L ${p.x * 10} ${p.y * 10}`),
                      ''
                    )}
                    fill="none"
                    stroke={currentColor}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </g>
            )}
          </svg>
        )}

        {/* Crisp HTML Overlay for Annotation Metadata Badges (Zero Distortion, 1:1 Pixel Scale) */}
        {imageLoaded && showAnnotations && (
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {annotations.map((ann) => {
              if (!ann.label) return null;
              const isSelected = selectedAnnotationId === ann.id;

              return (
                <div
                  key={`tag-${ann.id}`}
                  style={{
                    position: 'absolute',
                    left: `${ann.x}%`,
                    top: `${Math.max(1.5, ann.y)}%`,
                    transform: 'translateY(-100%)',
                  }}
                  className="pointer-events-auto pb-1"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAnnotationId(isSelected ? null : ann.id);
                    }}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black text-white whitespace-nowrap cursor-pointer select-none border border-black/40 ${
                      isSelected
                        ? 'ring-1 ring-white'
                        : 'opacity-100'
                    }`}
                    style={{ backgroundColor: ann.color }}
                  >
                    <Tag className="w-2.5 h-2.5 shrink-0" />
                    <span className="font-mono tracking-tight text-[9px] uppercase">{ann.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation Arrows Floating on Sides (Compact Figma Circular Buttons, No Shadows, Stable) */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevImage();
          }}
          className="absolute left-14 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0a0d14] hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors z-20"
          title="IMAGEN ANTERIOR (FLECHA IZQUIERDA)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNextImage();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0a0d14] hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors z-20"
          title="SIGUIENTE IMAGEN (FLECHA DERECHA)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Annotation Labeling Dialog (Flat, Crisp, No Shadow) */}
      {pendingAnnotation && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0e1118] border border-neutral-800 rounded-xl p-4 w-full max-w-sm animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-white text-xs font-black mb-2.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>ETIQUETAR DETALLE EN INSPECCION</span>
            </div>

            <p className="text-[10px] font-bold text-neutral-400 mb-2.5 uppercase tracking-wider">
              AGREGAR DESCRIPCION RAPIDA PARA TRAZABILIDAD:
            </p>

            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="EJ: ID CONTENEDOR, MATRICULA, CODIGO EAN..."
              className="w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase bg-neutral-900 border border-neutral-800 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 mb-2.5"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmPendingAnnotation();
              }}
            />

            {/* Quick chips - Uppercase Bold No Accents */}
            <div className="flex flex-wrap gap-1 mb-3.5">
              {[
                'SELLO DE SEGURIDAD CONFORME',
                'MATRICULA TRACTOCAMION',
                'LECTURA BARCODE OK',
                'DEFECTO EN CARTON',
                'ESTIBA CONFORME',
                'ENSAYO ELECTRICO APROBADO',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => confirmPendingAnnotation(chip)}
                  className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700/80 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setPendingAnnotation(null)}
                className="h-7 px-3 text-[10px] font-black uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={() => confirmPendingAnnotation()}
                className="h-7 px-3 text-[10px] font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>GUARDAR FIGURA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar: CLIC PARA RECORRIDO AUTOMATICO (Compact Figma Rounded Pill, Sin Acentos, Sin Sombras) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={onToggleAutoTour}
          className={`flex items-center gap-2 h-7 px-3.5 rounded-full border transition-all text-[10px] font-black tracking-wider uppercase ${
            isAutoTour
              ? 'bg-blue-600 border-blue-400 text-white'
              : 'bg-[#090b10] border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white hover:bg-neutral-900'
          }`}
          title="RECORRIDO AUTOMATICO DE FOTOGRAMAS"
        >
          {isAutoTour ? (
            <>
              <Pause className="w-3 h-3 fill-current" />
              <span>PAUSAR RECORRIDO</span>
              <div className="w-10 h-1 bg-blue-950 rounded-full overflow-hidden ml-1">
                <div 
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ width: `${autoTourProgress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current text-blue-400" />
              <span>CLIC PARA RECORRIDO AUTOMATICO</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
