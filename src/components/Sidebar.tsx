import React, { useState } from 'react';
import { 
  MessageSquare, 
  CornerDownRight, 
  X, 
  Smile, 
  Send, 
  Camera, 
  CheckCircle2, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { InspectionImage, PageGroup, Observation } from '../types/inspection';

interface SidebarProps {
  pageGroups: PageGroup[];
  allImages: InspectionImage[];
  currentImage: InspectionImage;
  onSelectImage: (image: InspectionImage) => void;
  observations: Observation[];
  onAddObservation: (obs: Omit<Observation, 'id' | 'timestamp'>) => void;
  onToggleReaction?: (obsId: string, emoji: string) => void;
  activeSidebarTab: 'images' | 'observations';
  setActiveSidebarTab: (tab: 'images' | 'observations') => void;
  isOpen: boolean;
  onClose: () => void;
}

const REACTION_OPTIONS = [
  { emoji: '👍', label: 'CONFORME' },
  { emoji: '🔍', label: 'VERIFICAR' },
  { emoji: '⚠️', label: 'ALERTA' },
  { emoji: '🎯', label: 'EXACTO' },
  { emoji: '❤️', label: 'APROBADO' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  pageGroups,
  allImages,
  currentImage,
  onSelectImage,
  observations,
  onAddObservation,
  onToggleReaction,
  activeSidebarTab,
  setActiveSidebarTab,
  isOpen,
  onClose,
}) => {
  // LiveChat states
  const [commentScope, setCommentScope] = useState<'current' | 'general'>('current');
  const [authorName, setAuthorName] = useState('VISITANTE (CONTROL CALIDAD)');
  const [commentText, setCommentText] = useState('');
  const [obsFilter, setObsFilter] = useState<'all' | 'current'>('all');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [openReactionMenuId, setOpenReactionMenuId] = useState<string | null>(null);

  // Filtered observations
  const displayedObservations = observations.filter((obs) => {
    if (obsFilter === 'current') {
      return obs.imageId === currentImage.id || obs.scope === 'current';
    }
    return true;
  });

  const handleFilterChange = (filter: 'all' | 'current') => {
    setIsChatLoading(true);
    setObsFilter(filter);
    setTimeout(() => setIsChatLoading(false), 250);
  };

  const handleSendComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim()) return;

    onAddObservation({
      imageId: commentScope === 'current' ? currentImage.id : undefined,
      imageTitle: commentScope === 'current' ? currentImage.title : undefined,
      pageNumber: commentScope === 'current' ? currentImage.page : undefined,
      author: authorName.trim().toUpperCase() || 'VISITANTE',
      role: 'INSPECTOR DE CALIDAD',
      scope: commentScope,
      category: 'info',
      text: commentText.trim(),
    });

    setCommentText('');
  };

  const handleQuickTagClick = (tag: string) => {
    setCommentText((prev) => (prev ? `${prev} - ${tag}` : tag));
  };

  // Get author avatar initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop (when drawer is open on small screens) */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden"
        onClick={onClose}
      />

      <aside className="fixed inset-y-0 right-0 z-40 md:relative md:inset-auto w-76 sm:w-80 md:w-80 lg:w-88 h-full bg-[#07090e] border-l border-neutral-800 flex flex-col shrink-0 select-none animate-in slide-in-from-right-4 duration-150">
        {/* Top Header Tabs - Compact Figma CMS Style (Height 40px) */}
        <div className="h-10 border-b border-neutral-800 grid grid-cols-[1fr_1fr_auto] bg-[#080b10] text-[10px] font-black uppercase tracking-wider items-center">
          {/* IMAGENES TAB */}
          <button
            onClick={() => setActiveSidebarTab('images')}
            className={`relative h-full flex items-center justify-center gap-1.5 transition-colors ${
              activeSidebarTab === 'images'
                ? 'text-white bg-neutral-900/60'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/20'
            }`}
          >
            <span>IMAGENES</span>
            <span className="font-mono text-[9px] px-1 py-0.2 bg-neutral-800 rounded text-neutral-300">494</span>
            {activeSidebarTab === 'images' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>

          {/* OBSERVACIONES TAB */}
          <button
            onClick={() => setActiveSidebarTab('observations')}
            className={`relative h-full flex items-center justify-center gap-1.5 transition-colors ${
              activeSidebarTab === 'observations'
                ? 'text-white bg-neutral-900/60'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/20'
            }`}
          >
            <span>OBSERVACIONES</span>
            <span className="font-mono text-[9px] px-1 py-0.2 bg-blue-950 text-blue-400 border border-blue-900 rounded">
              {observations.length}
            </span>
            {activeSidebarTab === 'observations' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="md:hidden h-full px-2.5 text-neutral-400 hover:text-white border-l border-neutral-800 flex items-center justify-center transition-colors"
            title="CERRAR PANEL"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      {/* TAB CONTENT: IMAGENES (Continuous Smooth Scroll, Zero Hover Scaling, No Pagination Bar) */}
      {activeSidebarTab === 'images' && (
        <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
          {pageGroups.map((group) => (
            <div key={`page-${group.page}`} className="space-y-1.5">
              {/* Compact Page Header */}
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1">
                <div className="flex items-center gap-1.5 font-mono font-black text-[10px] text-neutral-200 uppercase">
                  <span className="text-blue-400">PAG {group.page}</span>
                  <span className="text-neutral-600">·</span>
                  <span className="truncate max-w-[170px] text-neutral-400 font-bold text-[9px]">{group.title}</span>
                </div>
                <span className="text-[8px] font-mono font-bold text-neutral-500 uppercase">
                  {group.images.length} FOTOS
                </span>
              </div>

              {/* 5-Column Small Adjusted Square Thumbnails Grid (Static, Crisp, No Hover Scale or Jump) */}
              <div className="grid grid-cols-5 gap-1">
                {group.images.map((img) => {
                  const isActive = img.id === currentImage.id;
                  return (
                    <button
                      key={img.id}
                      onClick={() => onSelectImage(img)}
                      className={`relative aspect-square rounded overflow-hidden border bg-neutral-950 ${
                        isActive
                          ? 'border-blue-500 ring-1 ring-blue-500'
                          : 'border-neutral-800'
                      }`}
                      title={`${img.title} (${img.dimensions})`}
                    >
                      <img
                        src={img.src}
                        alt={img.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      {/* Compact index badge */}
                      <div className="absolute bottom-0.5 right-0.5 bg-black/90 text-[7px] font-mono font-black px-0.5 rounded text-neutral-300 leading-tight">
                        #{img.indexInPage}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: OBSERVACIONES (LiveChat Messenger Experience with Facebook Reactions & Skeletons) */}
      {activeSidebarTab === 'observations' && (
        <div className="flex-1 flex flex-col min-h-0 justify-between select-none">
          {/* LiveChat Header & Status Bar */}
          <div className="px-3 py-1.5 border-b border-neutral-800 bg-[#090c13] flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase font-bold text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-black">EN VIVO</span>
              <span className="text-neutral-700">·</span>
              <span className="text-neutral-300">3 AUDITORES</span>
            </div>

            {/* Filter Segmented Control */}
            <div className="flex items-center gap-0.5 bg-neutral-900 p-0.5 rounded border border-neutral-800">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-colors ${
                  obsFilter === 'all' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                TODAS ({observations.length})
              </button>
              <button
                onClick={() => handleFilterChange('current')}
                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-colors ${
                  obsFilter === 'current' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                ESTA FOTO
              </button>
            </div>
          </div>

          {/* Skeleton Loader State ("sksleton") */}
          {isChatLoading ? (
            <div className="flex-1 p-3 space-y-3.5 overflow-hidden">
              {[1, 2, 3].map((n) => (
                <div key={`skel-${n}`} className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-full bg-neutral-800/80 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2.5 bg-neutral-800/80 rounded animate-pulse" />
                      <div className="w-12 h-2 bg-neutral-900 rounded animate-pulse" />
                    </div>
                    <div className="p-3 rounded-2xl rounded-tl-xs bg-[#0d111a] border border-neutral-800/80 space-y-1.5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-shimmer" />
                      <div className="w-3/4 h-2 bg-neutral-800/80 rounded" />
                      <div className="w-full h-2 bg-neutral-800/60 rounded" />
                      <div className="w-2/3 h-2 bg-neutral-800/60 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* LiveChat Bubbles Scroll Container */
            <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
              {displayedObservations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-neutral-500">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-2">
                    <MessageSquare className="w-4 h-4 text-neutral-500" />
                  </div>
                  <span className="text-[10px] font-black tracking-wider uppercase text-neutral-300">
                    SIN MENSAJES EN ESTE FOTOGRAMA
                  </span>
                  <p className="text-[9px] text-neutral-500 mt-1 max-w-[200px] uppercase font-bold leading-normal">
                    SE EL PRIMERO EN PUBLICAR UN HALLAZGO DE CONTROL DE CALIDAD.
                  </p>
                </div>
              ) : (
                displayedObservations.map((obs) => {
                  const isTargetCurrent = obs.imageId === currentImage.id;
                  const targetImage = allImages.find((img) => img.id === obs.imageId);

                  return (
                    <div key={obs.id} className="group relative flex gap-2.5 items-start text-[11px]">
                      {/* Avatar with live status indicator */}
                      <div className="relative shrink-0">
                        <div 
                          className="w-7 h-7 rounded-full flex items-center justify-center font-mono font-black text-[9px] text-white border border-white/10"
                          style={{ backgroundColor: obs.avatarColor || '#3b82f6' }}
                        >
                          {getInitials(obs.author)}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#07090e]" />
                      </div>

                      {/* Message Content Container */}
                      <div className="flex-1 min-w-0 space-y-1">
                        {/* Header Row: Author + Verified Badge + Timestamp */}
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="font-black uppercase tracking-wider text-neutral-200 truncate text-[10px]">
                              {obs.author}
                            </span>
                            {obs.isAuditorVerified && (
                              <span 
                                className="w-3 h-3 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[8px] font-black shrink-0" 
                                title="AUDITOR SENIOR VERIFICADO"
                              >
                                ✓
                              </span>
                            )}
                          </div>
                          <span className="text-[8px] font-mono text-neutral-500 uppercase font-semibold shrink-0">
                            {obs.timestamp}
                          </span>
                        </div>

                        {/* Role & Target Fotograma Link */}
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-neutral-400 uppercase text-[8px] font-medium">{obs.role}</span>
                          
                          {obs.pageNumber && (
                            <button
                              onClick={() => {
                                if (targetImage) onSelectImage(targetImage);
                              }}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase transition-colors border ${
                                isTargetCurrent
                                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
                              }`}
                              title="VER ESTE FOTOGRAMA"
                            >
                              <Camera className="w-2.5 h-2.5" />
                              <span>PAG {obs.pageNumber}</span>
                              <CornerDownRight className="w-2 h-2 text-neutral-500" />
                            </button>
                          )}
                        </div>

                        {/* LiveChat Message Bubble (Messenger Style) */}
                        <div className={`p-2.5 rounded-2xl rounded-tl-xs border text-[11px] leading-relaxed relative ${
                          isTargetCurrent
                            ? 'bg-[#101726] border-blue-500/40 text-neutral-100'
                            : 'bg-[#0d111a] border-neutral-800/90 text-neutral-200'
                        }`}>
                          <p className="font-normal text-[11px] select-text">{obs.text}</p>
                        </div>

                        {/* Facebook / Messenger Style Reactions Bar */}
                        <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                          {/* Active Reaction Badges */}
                          {obs.reactions && Object.entries(obs.reactions).map(([emoji, count]) => {
                            const hasReacted = obs.userReacted?.includes(emoji);
                            return (
                              <button
                                key={emoji}
                                onClick={() => onToggleReaction?.(obs.id, emoji)}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold transition-colors border ${
                                  hasReacted
                                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                                }`}
                                title={`REACCIONAR CON ${emoji}`}
                              >
                                <span>{emoji}</span>
                                <span>{count}</span>
                              </button>
                            );
                          })}

                          {/* Add Reaction Button (+) */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenReactionMenuId(openReactionMenuId === obs.id ? null : obs.id)}
                              className="w-5 h-5 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center text-[10px] transition-colors"
                              title="REACCIONAR AL MENSAJE"
                            >
                              <Smile className="w-2.5 h-2.5" />
                            </button>

                            {/* Facebook Reaction Popover Bar */}
                            {openReactionMenuId === obs.id && (
                              <div 
                                className="absolute bottom-6 left-0 bg-[#0e131d] border border-neutral-700 rounded-full p-1 flex items-center gap-1 z-50 animate-in zoom-in-95"
                                onMouseLeave={() => setOpenReactionMenuId(null)}
                              >
                                {REACTION_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.emoji}
                                    onClick={() => {
                                      onToggleReaction?.(obs.id, opt.emoji);
                                      setOpenReactionMenuId(null);
                                    }}
                                    className="w-6 h-6 rounded-full hover:bg-neutral-800 flex items-center justify-center text-sm transition-transform hover:scale-125"
                                    title={opt.label}
                                  >
                                    {opt.emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Modern LiveChat Messenger Composer */}
          <div className="p-2.5 border-t border-neutral-800 bg-[#090c13] space-y-1.5 shrink-0">
            {/* Scope Selector: ESTA FOTO vs GENERAL */}
            <div className="grid grid-cols-2 gap-1 p-0.5 bg-neutral-900 border border-neutral-800 rounded-md">
              <button
                type="button"
                onClick={() => setCommentScope('current')}
                className={`py-1 text-[9px] font-black tracking-wider rounded transition-all uppercase flex items-center justify-center gap-1 ${
                  commentScope === 'current'
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Camera className="w-2.5 h-2.5" />
                <span>ESTA FOTO (PAG {currentImage.page})</span>
              </button>
              <button
                type="button"
                onClick={() => setCommentScope('general')}
                className={`py-1 text-[9px] font-black tracking-wider rounded transition-all uppercase ${
                  commentScope === 'general'
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                GENERAL DEL EXPEDIENTE
              </button>
            </div>

            {/* Quick Audit Tags Strip */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {[
                'SELLO OK',
                'ESTIBA CONFORME',
                'REVISAR CODIGO',
                'DEFECTO MENOR',
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickTagClick(tag)}
                  className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 shrink-0 transition-colors"
                >
                  +{tag}
                </button>
              ))}
            </div>

            {/* Author Input Field */}
            <div>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="TU NOMBRE (INSPECTOR / AUDITOR)"
                className="w-full px-2 py-1 text-[9px] font-mono font-bold uppercase bg-neutral-900/90 border border-neutral-800 rounded text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Chat Textarea with Enter-to-Send Handler */}
            <div className="relative">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
                rows={2}
                placeholder={
                  commentScope === 'current'
                    ? `Escribe observacion sobre pag. ${currentImage.page} (Enter para enviar)...`
                    : 'Escribe observacion general del expediente (Enter para enviar)...'
                }
                className="w-full px-2.5 py-1.5 text-[10px] font-sans bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 resize-none pr-8 leading-snug"
              />

              {/* Quick Send Icon inside or below */}
              <button
                type="button"
                onClick={() => handleSendComment()}
                disabled={!commentText.trim()}
                className="absolute right-1.5 bottom-2.5 w-6 h-6 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
                title="PUBLICAR OBSERVACION"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
    </>
  );
};
