import React, { useState, useEffect } from 'react';
import { Page } from '../App';
import { EditIcon } from '../components/EditIcon';
import { TrashIcon } from '../components/TrashIcon';
import { SavedReport, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { reportService } from '../services/reportService';
import { userService } from '../services/userService';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { DownloadIcon } from '../components/DownloadIcon';

interface SavedReportsProps {
  navigateTo: (page: Page) => void;
  onEditReport: (report: SavedReport) => void;
}

const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const correctedDate = new Date(date.getTime() + userTimezoneOffset);
  return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(correctedDate);
};

const SavedReports: React.FC<SavedReportsProps> = ({ navigateTo, onEditReport }) => {
  const { user, isMasterUser } = useAuth();
  const [allReports, setAllReports] = useState<SavedReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportToDelete, setReportToDelete] = useState<SavedReport | null>(null);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [usersWithReports, setUsersWithReports] = useState<User[]>([]);

  useEffect(() => {
    loadData();
  }, [user, isMasterUser]);
  
  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    
    const reports = await reportService.getReports(user.id, isMasterUser);
    setAllReports(reports);

    if (isMasterUser) {
      const allUsers = await userService.getUsers();
      const newMap = new Map<string, string>();
      allUsers.forEach(u => newMap.set(u.id, u.name));
      setUserMap(newMap);

      const reportUserIds = new Set(reports.map(r => r.userId));
      const usersWhoHaveReports = allUsers.filter(u => reportUserIds.has(u.id));
      setUsersWithReports(usersWhoHaveReports);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    let reportsToFilter = [...allReports];

    if (isMasterUser && selectedUserId !== 'all') {
      reportsToFilter = reportsToFilter.filter(report => report.userId === selectedUserId);
    }

    if (startDate) {
      const start = new Date(startDate).getTime();
      reportsToFilter = reportsToFilter.filter(report => new Date(report.date).getTime() >= start);
    }

    if (endDate) {
      const end = new Date(endDate).getTime();
      reportsToFilter = reportsToFilter.filter(report => new Date(report.date).getTime() <= end);
    }

    reportsToFilter.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredReports(reportsToFilter);
  }, [allReports, startDate, endDate, selectedUserId, isMasterUser]);


  const handleDownloadReport = (report: SavedReport) => {
    try {
      const selectedDate = new Date(report.date);
      const day = String(selectedDate.getDate() + 1).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      const fileName = `Report ${day}-${month}-${year}.doc`;

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
      
      const formattedContent = formatTextForDoc(report.text);
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
      console.error("Failed to save file:", error.message || error);
      alert("Errore durante il download del report.");
    }
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    const result = await reportService.deleteReport(reportToDelete.id);
    setReportToDelete(null);
    if (result.success) {
      loadData(); // Reload data after deletion
    } else {
      alert(result.message || "Errore durante l'eliminazione del report.");
    }
  };
  
  const cancelDelete = () => {
      setReportToDelete(null);
  };
  
  const renderFilters = () => {
    return (
      <div className={`grid grid-cols-1 ${isMasterUser ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 mb-6 px-8`}>
        {isMasterUser && (
          <div>
            <label htmlFor="user-filter" className="block text-sm font-medium text-gray-700 mb-1">Utente</label>
            <select
              id="user-filter"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti gli utenti</option>
              {usersWithReports.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Da</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">A</label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    );
  };

  const renderReportList = () => (
    <div className="space-y-4 max-h-96 overflow-y-auto pr-2 px-8 pb-8">
      {filteredReports.length > 0 ? (
        filteredReports.map((report) => (
          <div key={report.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-gray-800">{formatDateForDisplay(report.date)}</h3>
              {isMasterUser && (
                <p className="text-sm font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full inline-block my-1">
                  {userMap.get(report.userId) || 'Utente Sconosciuto'}
                </p>
              )}
              <p className="text-sm text-gray-500 truncate max-w-sm">{report.text.split('\n')[2] || 'Nessun contenuto'}</p>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button onClick={() => handleDownloadReport(report)} className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors" aria-label="Scarica report">
                <DownloadIcon />
              </button>
              <button onClick={() => onEditReport(report)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" aria-label="Modifica report">
                <EditIcon />
              </button>
              <button onClick={() => setReportToDelete(report)} className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors" aria-label="Elimina report">
                <TrashIcon />
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 py-8">Nessun report trovato.</p>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 relative">
       {reportToDelete && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
                <h2 className="text-xl font-bold text-gray-800">Conferma Eliminazione</h2>
                <p className="text-gray-600 mt-2">Sei sicuro di voler eliminare il report del <span className="font-semibold">{formatDateForDisplay(reportToDelete.date)}</span>? L'azione è irreversibile.</p>
                <div className="mt-6 flex justify-center gap-4">
                    <button onClick={cancelDelete} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300">Annulla</button>
                    <button onClick={confirmDelete} className="px-6 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700">Sì, Elimina</button>
                </div>
            </div>
        </div>
      )}
      <div className="pt-8 space-y-6">
        <header className="px-8">
          <div className="relative flex items-center justify-center">
            <button onClick={() => navigateTo('landing')} className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-md p-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900" aria-label="Torna al pannello di controllo">
              <ArrowLeftIcon />
              <span className="hidden sm:inline">Indietro</span>
            </button>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">Report Salvati</h1>
          </div>
          <p className="mt-2 text-center text-gray-500">
            {isMasterUser ? "Filtra e visualizza i report di tutti gli utenti." : "Filtra e visualizza i tuoi report salvati."}
          </p>
        </header>
        
        {isLoading ? (
          <p className="text-center text-gray-500 py-8">Caricamento report...</p>
        ) : (
          <>
            {renderFilters()}
            {renderReportList()}
          </>
        )}
      </div>
    </div>
  );
};

export default SavedReports;