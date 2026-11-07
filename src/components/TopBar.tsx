import React, { useState } from 'react';
import { 
  Download, 
  Sun, 
  Moon, 
  PenTool, 
  Square, 
  Circle, 
  MoveRight, 
  Pencil, 
  X, 
  Contrast, 
  Maximize2,
  Check,
  PanelRight
} from 'lucide-react';
import { AnnotationTool, InspectionImage } from '../types/inspection';

interface TopBarProps {
  currentImage: InspectionImage;
  totalImagesCount: number;
  activeTool: AnnotationTool;
  setActiveTool: (tool: AnnotationTool) => void;
  currentColor: string;
  setCurrentColor: (color: string) => void;
  onDownloadCurrent: () => void;
  onDownloadAll: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  contrastMode: 'normal' | 'contrast' | 'brightness' | 'invert';
  setContrastMode: (mode: 'normal' | 'contrast' | 'brightness' | 'invert') => void;
  onToggleFullscreen: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const COLOR_PALETTE = [
  { name: 'ROJO ALERTA', hex: '#ef4444' },
  { name: 'AZUL AUDITORIA', hex: '#3b82f6' },
  { name: 'AMBAR ADVERTENCIA', hex: '#f59e0b' },
  { name: 'VERDE CONFORME', hex: '#10b981' },
  { name: 'BLANCO NEUTRO', hex: '#ffffff' },
];

export const TopBar: React.FC<TopBarProps> = ({
  currentImage,
  totalImagesCount,
  activeTool,
  setActiveTool,
  currentColor,
  setCurrentColor,
  onDownloadCurrent,
  onDownloadAll,
  isDark,
  onToggleTheme,
  contrastMode,
  setContrastMode,
  onToggleFullscreen,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showContrastMenu, setShowContrastMenu] = useState(false);

  const isAnnotating = activeTool !== null && activeTool !== 'select';

  return (
    <header className="h-11 border-b border-neutral-800 bg-[#080a0f] px-3 flex items-center justify-between select-none z-30 shrink-0">
      {/* Zone 1: Pure SIA Brand Lockup + Compact Single-Line Breadcrumb */}
      <div className="flex items-center gap-3 shrink-0">
        {/* SIA INSPECTIONS Lockup (Clean, Dedicated Software, No External Logos) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[#ef4444] font-black text-sm tracking-tighter">»</span>
          <span className="text-white font-black text-xs tracking-wider uppercase">SIA INSPECTIONS</span>
        </div>

        {/* Compact Single-Line Guaranteed Breadcrumb (No Wrapping) */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono pl-2.5 border-l border-neutral-800 whitespace-nowrap shrink-0">
          <span className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-300 font-bold uppercase tracking-wider text-[10px]">
            PAGINA {currentImage.page}
          </span>
          <span className="text-neutral-600">·</span>
          <span className="text-blue-400 font-bold uppercase tracking-wider">
            IMAGEN {currentImage.indexInPage}
          </span>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-500 font-semibold tabular-nums">494</span>
        </div>

        {/* Truncated image title in mono */}
        <div className="hidden 2xl:flex items-center gap-2 text-[10px] text-neutral-400 font-mono">
          <span className="text-neutral-800">|</span>
          <span className="truncate max-w-[240px] font-semibold uppercase text-neutral-400" title={currentImage.title}>
            {currentImage.title}
          </span>
        </div>
      </div>

      {/* Zone 2: Center Status or Compact FIGURAR Subtoolbar */}
      <div className="flex items-center justify-center">
        {isAnnotating ? (
          <div className="flex items-center gap-1 bg-[#0e1118] border border-blue-500/40 rounded-lg p-0.5 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => setActiveTool('rect')}
              className={`px-2 py-0.5 text-[10px] font-black rounded flex items-center gap-1 transition-colors uppercase tracking-wider ${
                activeTool === 'rect' ? 'bg-blue-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'
              }`}
              title="DIBUJAR RECTANGULO"
            >
              <Square className="w-3 h-3" />
              <span className="hidden sm:inline">RECT</span>
            </button>

            <button
              onClick={() => setActiveTool('circle')}
              className={`px-2 py-0.5 text-[10px] font-black rounded flex items-center gap-1 transition-colors uppercase tracking-wider ${
                activeTool === 'circle' ? 'bg-blue-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'
              }`}
              title="DIBUJAR CIRCULO"
            >
              <Circle className="w-3 h-3" />
              <span className="hidden sm:inline">CIRCULO</span>
            </button>

            <button
              onClick={() => setActiveTool('oval')}
              className={`px-2 py-0.5 text-[10px] font-black rounded flex items-center gap-1 transition-colors uppercase tracking-wider ${
                activeTool === 'oval' ? 'bg-blue-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'
              }`}
              title="DIBUJAR OVALO"
            >
              <div className="w-3 h-2 rounded-full border border-current" />
              <span className="hidden sm:inline">OVALO</span>
            </button>

            <button
              onClick={() => setActiveTool('arrow')}
              className={`px-2 py-0.5 text-[10px] font-black rounded flex items-center gap-1 transition-colors uppercase tracking-wider ${
                activeTool === 'arrow' ? 'bg-blue-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'
              }`}
              title="DIBUJAR FLECHA"
            >
              <MoveRight className="w-3 h-3" />
              <span className="hidden sm:inline">FLECHA</span>
            </button>

            <button
              onClick={() => setActiveTool('pen')}
              className={`px-2 py-0.5 text-[10px] font-black rounded flex items-center gap-1 transition-colors uppercase tracking-wider ${
                activeTool === 'pen' ? 'bg-blue-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'
              }`}
              title="PLUMA LIBRE"
            >
              <Pencil className="w-3 h-3" />
              <span className="hidden sm:inline">PLUMA</span>
            </button>

            <div className="w-px h-3.5 bg-neutral-700 mx-0.5" />

            <button
              onClick={() => setActiveTool(null)}
              className="px-2 py-0.5 text-[10px] font-black text-rose-400 hover:bg-rose-950/60 rounded flex items-center gap-1 transition-colors uppercase tracking-wider"
              title="CANCELAR DIBUJO"
            >
              <X className="w-3 h-3" />
              <span>CANCELAR</span>
            </button>
          </div>
        ) : (
          <div className="hidden xl:flex items-center gap-2 text-[10px] font-mono bg-neutral-900 border border-neutral-800 px-3 py-0.5 rounded-md whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-neutral-200 font-bold tracking-wider uppercase">EXPEDIENTE QA-CN-2026-8868</span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-400 font-semibold tracking-wider uppercase">494 FOTOGRAMAS</span>
          </div>
        )}
      </div>

      {/* Zone 3: Compact Small Rounded CMS Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Compact Segmented Buttons: TODAS / ACTUAL */}
        <div className="flex items-center gap-0.5 bg-neutral-900 border border-neutral-800 rounded-md p-0.5">
          <button
            onClick={onDownloadAll}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors whitespace-nowrap uppercase tracking-wider"
            title="DESCARGAR REPORTE Y FOTOS"
          >
            <Download className="w-3 h-3 text-neutral-400" />
            <span>TODAS</span>
          </button>

          <button
            onClick={onDownloadCurrent}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors whitespace-nowrap border-l border-neutral-800 uppercase tracking-wider"
            title="DESCARGAR FOTO ACTUAL"
          >
            <Download className="w-3 h-3 text-blue-400" />
            <span>ACTUAL</span>
          </button>
        </div>

        {/* Small FIGURAR Button */}
        <div className="relative flex items-center">
          <button
            onClick={() => setActiveTool(isAnnotating ? null : 'rect')}
            className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-md border transition-all uppercase tracking-wider ${
              isAnnotating
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:border-neutral-700'
            }`}
            title="HERRAMIENTA DE ANOTACION FIGURAR"
          >
            <PenTool className="w-3 h-3 text-blue-400" />
            <span>FIGURAR</span>
          </button>

          {/* Small Color Selector Swatch */}
          <div className="relative ml-1">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-6 h-6 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700 flex items-center justify-center transition-colors"
              title="COLOR DE TRAZO"
            >
              <span
                className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20"
                style={{ backgroundColor: currentColor }}
              />
            </button>

            {showColorPicker && (
              <div 
                className="absolute right-0 top-8 bg-[#0f121a] border border-neutral-700 rounded-lg p-1.5 z-50 flex flex-col gap-1 min-w-[140px]"
                onMouseLeave={() => setShowColorPicker(false)}
              >
                <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider px-1">COLOR DE FIGURA</span>
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => {
                      setCurrentColor(c.hex);
                      setShowColorPicker(false);
                    }}
                    className="flex items-center gap-2 px-1.5 py-1 text-[10px] text-neutral-200 hover:bg-neutral-800 rounded transition-colors font-bold uppercase tracking-wide"
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
                    <span>{c.name}</span>
                    {currentColor === c.hex && <Check className="w-2.5 h-2.5 ml-auto text-blue-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Small Contrast / Inspection filter toggle */}
        <div className="relative">
          <button
            onClick={() => setShowContrastMenu(!showContrastMenu)}
            className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors border ${
              contrastMode !== 'normal'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
            title="REALCE OPTICO DE INSPECCION"
          >
            <Contrast className="w-3.5 h-3.5" />
          </button>

          {showContrastMenu && (
            <div 
              className="absolute right-0 top-8 bg-[#0f121a] border border-neutral-700 rounded-lg p-1 z-50 min-w-[140px] flex flex-col gap-0.5"
              onMouseLeave={() => setShowContrastMenu(false)}
            >
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider px-1.5 py-0.5">FILTRO OPTICO</span>
              {[
                { id: 'normal', label: 'ESTANDAR' },
                { id: 'contrast', label: 'ALTO CONTRASTE' },
                { id: 'brightness', label: 'REALCE SOMBRAS' },
                { id: 'invert', label: 'INVERTIR NEGATIVO' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setContrastMode(opt.id as any);
                    setShowContrastMenu(false);
                  }}
                  className={`px-1.5 py-1 text-[10px] rounded text-left flex items-center justify-between transition-colors font-bold uppercase tracking-wider ${
                    contrastMode === opt.id ? 'bg-blue-600/30 text-blue-300' : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <span>{opt.label}</span>
                  {contrastMode === opt.id && <Check className="w-2.5 h-2.5 text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Small Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-6 h-6 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 flex items-center justify-center transition-colors"
          title={isDark ? 'CAMBIAR A MODO CLARO' : 'CAMBIAR A MODO OSCURO'}
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Small Fullscreen toggle */}
        <button
          onClick={onToggleFullscreen}
          className="w-6 h-6 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 flex items-center justify-center transition-colors hidden sm:flex"
          title="PANTALLA COMPLETA"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Small Responsive Sidebar Panel Toggle (Figma Style) */}
        <button
          onClick={onToggleSidebar}
          className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
            isSidebarOpen
              ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
          }`}
          title={isSidebarOpen ? 'OCULTAR PANEL LATERAL' : 'MOSTRAR PANEL LATERAL'}
        >
          <PanelRight className="w-3.5 h-3.5" />
        </button>

        {/* Small S3 Storage Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded-md text-neutral-300 text-[10px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span className="font-bold tracking-wider uppercase text-[9px]">S3 STORAGE</span>
        </div>
      </div>
    </header>
  );
};
