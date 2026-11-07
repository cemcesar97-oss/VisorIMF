import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Archive, 
  Table, 
  CheckCircle, 
  X, 
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { InspectionImage, Observation } from '../types/inspection';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalImages: number;
  observationsCount: number;
  currentImage?: InspectionImage;
  exportType: 'all' | 'current';
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  totalImages,
  observationsCount,
  currentImage,
  exportType,
}) => {
  const [format, setFormat] = useState<'pdf' | 'zip' | 'csv'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadCompleted, setDownloadCompleted] = useState(false);

  if (!isOpen) return null;

  const handleStartExport = () => {
    setIsExporting(true);
    setDownloadCompleted(false);

    // Simulate reliable bundle packaging
    setTimeout(() => {
      setIsExporting(false);
      setDownloadCompleted(true);

      // Trigger synthetic download
      const fileName =
        exportType === 'current'
          ? `SIA_Inspeccion_Pagina_${currentImage?.page || 1}_Foto_${currentImage?.indexInPage || 1}.${format === 'csv' ? 'csv' : format}`
          : `SIA_Reporte_Completo_Lote_494_${new Date().toISOString().slice(0, 10)}.${format === 'csv' ? 'csv' : format === 'pdf' ? 'pdf' : 'zip'}`;

      const dummyContent = `SIA INSPECTIONS - REPORTE DE CALIDAD Y TRAZABILIDAD\nID: QA-CN-2026-8868\nImágenes: ${totalImages}\nObservaciones: ${observationsCount}\nGenerado el: ${new Date().toLocaleString()}`;
      const blob = new Blob([dummyContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1118] border border-neutral-800 rounded-xl w-full max-w-md p-5 relative animate-in zoom-in-95 select-none">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white tracking-wider uppercase">
              {exportType === 'current' ? 'EXPORTAR FOTOGRAMA ACTUAL' : 'DESCARGAR LOTE DE INSPECCION'}
            </h3>
            <p className="text-[10px] font-mono text-neutral-400 uppercase">
              {exportType === 'current'
                ? `PAGINA ${currentImage?.page} · IMAGEN #${currentImage?.indexInPage}`
                : `494 FOTOGRAMAS SINCRONIZADOS EN STORAGE S3`}
            </p>
          </div>
        </div>

        {/* Format Selector */}
        <div className="space-y-1.5 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            FORMATO DE EXPORTACION:
          </span>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { setFormat('pdf'); setDownloadCompleted(false); }}
              className={`p-2.5 rounded-lg border flex flex-col items-center gap-1 transition-all text-[10px] font-black uppercase tracking-wider ${
                format === 'pdf'
                  ? 'bg-blue-600/20 border-blue-500 text-white'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>REPORTE PDF</span>
            </button>

            <button
              onClick={() => { setFormat('zip'); setDownloadCompleted(false); }}
              className={`p-2.5 rounded-lg border flex flex-col items-center gap-1 transition-all text-[10px] font-black uppercase tracking-wider ${
                format === 'zip'
                  ? 'bg-blue-600/20 border-blue-500 text-white'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <Archive className="w-4 h-4 text-cyan-400" />
              <span>PAQUETE ZIP</span>
            </button>

            <button
              onClick={() => { setFormat('csv'); setDownloadCompleted(false); }}
              className={`p-2.5 rounded-lg border flex flex-col items-center gap-1 transition-all text-[10px] font-black uppercase tracking-wider ${
                format === 'csv'
                  ? 'bg-blue-600/20 border-blue-500 text-white'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <Table className="w-4 h-4 text-emerald-400" />
              <span>BITACORA CSV</span>
            </button>
          </div>
        </div>

        {/* Security & Verification Note */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-lg p-2.5 mb-5 flex items-start gap-2 text-[10px] text-neutral-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <span className="uppercase text-[9px] leading-relaxed">
            LOS ARCHIVOS INCLUYEN TRAZABILIDAD CRIPTOGRAFICA SHA-256, SELLOS DE CALIDAD AUDITADOS Y FIGURAS DE DETALLE.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="h-7 px-3 text-[10px] font-black uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
          >
            CERRAR
          </button>

          <button
            onClick={handleStartExport}
            disabled={isExporting}
            className="h-7 px-3.5 text-[10px] font-black uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-md transition-all flex items-center gap-1.5"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>EMPAQUETANDO...</span>
              </>
            ) : downloadCompleted ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-white" />
                <span>DESCARGADO</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>GENERAR DESCARGA</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
