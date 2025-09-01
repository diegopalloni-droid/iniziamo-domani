import React, { useState, useEffect } from 'react';
import { REPORT_CONTENT_TEMPLATE, REPORT_VISIT_DETAILS_TEMPLATE } from '../constants';
import { PlusIcon } from '../components/PlusIcon';
import { SaveIcon } from '../components/SaveIcon';
import { Page } from '../App';
import { SavedReport } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { reportService } from '../services/reportService';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';

interface ReportCreatorProps {
  navigateTo: (page: Page) => void;
  initialReport: SavedReport | null;
}

const formatDateForDisplay = (date: Date): string => {
  return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getDefaultText = (date: Date) => `Report del ${formatDateForDisplay(date)}\n\n${REPORT_CONTENT_TEMPLATE}`;

const formatTextForDoc = (text: string): string => {
    const lines = text.split('\n');
    return lines.map(line => {
      const style = `font-family:Calibri,sans-serif;font-size:11.0pt;`;
      if (line.trim() === '') return `<p style="margin:0;"><span style="${style}">&nbsp;</span></p>`;
      if (/^Report del/.test(line)) return `<p style="margin:0;"><span style="${style}"><b>${line}</b></span></p>`;
      
      const match = line.match(/^(Visita n°\d+:|Riassunto visita:|Obiettivo prox visita:|Prox visita entro:)/);
      if (match) {
        const prefix = match[0];
        const userText = line.substring(prefix.length);
        return `<p style="margin:0;"><span style="${style}"><b>${prefix}</b>${userText}</span></p>`;
      }
      
      return `<p style="margin:0;"><span style="${style}">${line}</span></p>`;
    }).join('');
};

const ReportCreator: React.FC<ReportCreatorProps> = ({ navigateTo, initialReport }) => {
  
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [templateText, setTemplateText] = useState<string>(getDefaultText(new Date()));
  const [visitCount, setVisitCount] = useState<number>(0);
  const [saveButtonText, setSaveButtonText] = useState<string>('Salva');
  const [isSaving, setIsSaving] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);

  useEffect(() => {
    if (initialReport) {
      const date = new Date(initialReport.date);
      // Adjust for timezone offset when creating Date from ISO string
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      const correctedDate = new Date(date.getTime() + userTimezoneOffset);

      setSelectedDate(correctedDate);
      setTemplateText(initialReport.text);
      setEditingReportId(initialReport.id);
    } else {
      const today = new Date();
      setSelectedDate(today);
      setTemplateText(getDefaultText(today));
      setEditingReportId(null);
    }
  }, [initialReport]);

  useEffect(() => {
    const count = (templateText.match(/Visita n°/g) || []).length;
    setVisitCount(count);
  }, [templateText]);

  const handleDownloadLocally = () => {
    try {
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      const fileName = `Report ${day}-${month}-${year}.doc`;

      const formattedContent = formatTextForDoc(templateText);
      const htmlString = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Report</title></head>
            <body><div>${formattedContent}</div></body>
          </html>`;

      const blob = new Blob([htmlString], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
        console.error("Failed to download file:", error.message || error);
        alert("Errore durante il download del report.");
    }
  };

  const handleSaveToCloud = async () => {
    if (!user) {
      alert("Utente non loggato. Impossibile salvare.");
      return;
    }
    
    setIsSaving(true);
    setSaveButtonText('Salvo...');
    
    const reportData = {
      date: selectedDate.toISOString().split('T')[0], // Save as YYYY-MM-DD
      text: templateText,
      userId: user.id,
    };
    
    let result: { success: boolean; message?: string };
    if (editingReportId) {
      result = await reportService.updateReport(editingReportId, reportData);
    } else {
      result = await reportService.saveReport(reportData);
    }

    setIsSaving(false);

    if (result.success) {
      setSaveButtonText('Salvato!');
      setTimeout(() => {
        navigateTo('saved');
      }, 1000);
    } else {
      setSaveButtonText('Salva');
      alert(result.message || "Non è stato possibile salvare il report.");
    }
  };

  const handleAddVisit = () => {
    const newVisitNumber = visitCount + 1;
    const newVisitText = `\n\nVisita n°${newVisitNumber}: ${REPORT_VISIT_DETAILS_TEMPLATE}`;
    setTemplateText(prevText => prevText + newVisitText);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    const timezoneOffset = newDate.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(newDate.getTime() + timezoneOffset);
    
    setSelectedDate(adjustedDate);
    const dateDisplay = formatDateForDisplay(adjustedDate);
    setTemplateText(prevText => {
      return prevText.replace(/^Report del .*(\r\n|\n|\r)/, `Report del ${dateDisplay}\n`);
    });
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 relative">
      <div className="p-8 space-y-6">
        <header>
          <div className="relative flex items-center justify-center">
            <button
              onClick={() => navigateTo('landing')}
              className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-md p-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              aria-label="Torna al pannello di controllo"
            >
              <ArrowLeftIcon />
              <span className="hidden sm:inline">Indietro</span>
            </button>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">{editingReportId ? 'Modifica Report' : 'Crea Report'}</h1>
          </div>
          <p className="mt-2 text-center text-gray-500">
            Compila e salva il tuo report giornaliero.
          </p>
        </header>

        <div className="space-y-4">
            <div>
                <label htmlFor="report-date" className="block text-sm font-medium text-gray-700 mb-1">Data del Report</label>
                <input
                    id="report-date"
                    type="date"
                    value={formatDateForInput(selectedDate)}
                    onChange={handleDateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Data del report"
                />
            </div>
            <div>
                <label htmlFor="report-text" className="block text-sm font-medium text-gray-700 mb-1">Contenuto Report</label>
                <textarea
                    id="report-text"
                    value={templateText}
                    onChange={(e) => setTemplateText(e.target.value)}
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Contenuto del report"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
                onClick={handleAddVisit}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-md shadow-sm transition-colors"
                disabled={isSaving}
            >
                <PlusIcon />
                Aggiungi Visita
            </button>
             <button
                onClick={handleDownloadLocally}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md shadow-sm transition-colors"
                disabled={isSaving}
            >
                Scarica
            </button>
            <button
                onClick={handleSaveToCloud}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-md shadow-sm transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                disabled={isSaving}
            >
                <SaveIcon />
                {saveButtonText}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ReportCreator;