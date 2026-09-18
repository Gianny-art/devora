import { Business } from '@/types';
import { exportScanToPdf, exportScanToCsv, ScanExportMeta } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Lock } from 'lucide-react';

interface Props {
  businesses: Business[];
  meta: ScanExportMeta;
  canExport: boolean;
  lang: 'fr' | 'en';
  onUpgradeClick?: () => void;
}

export function ExportScanButton({ businesses, meta, canExport, lang, onUpgradeClick }: Props) {
  if (!canExport) {
    return (
      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onUpgradeClick}>
        <Lock className="w-3 h-3" /> {lang === 'fr' ? 'Exporter' : 'Export'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={businesses.length === 0}>
          <Download className="w-3 h-3" /> {lang === 'fr' ? 'Exporter' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportScanToPdf(businesses, meta, lang)} className="gap-2 text-xs">
          <FileText className="w-3.5 h-3.5" /> PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportScanToCsv(businesses, meta, lang)} className="gap-2 text-xs">
          <FileSpreadsheet className="w-3.5 h-3.5" /> CSV / Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
