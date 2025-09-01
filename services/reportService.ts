import { SavedReport } from '../types';
import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';

const REPORTS_COLLECTION = 'reports';

export const reportService = {
  async getReports(userId: string, isMasterUser: boolean): Promise<SavedReport[]> {
    try {
      const reportsRef = collection(db, REPORTS_COLLECTION);
      let q;
      if (isMasterUser) {
        q = query(reportsRef, orderBy('date', 'desc'));
      } else {
        q = query(reportsRef, where('userId', '==', userId), orderBy('date', 'desc'));
      }
      const querySnapshot = await getDocs(q);
      const reports: SavedReport[] = [];
      querySnapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() } as SavedReport);
      });
      return reports;
    } catch (error: any) {
      console.error("Error fetching reports:", error.message || error);
      return [];
    }
  },

  async saveReport(report: { date: string, text: string, userId: string }): Promise<{ success: boolean; message?: string }> {
    try {
      await addDoc(collection(db, REPORTS_COLLECTION), report);
      return { success: true };
    } catch (error: any) {
      console.error("Error saving report:", error.message || error);
      return { success: false, message: "Errore durante il salvataggio." };
    }
  },
  
  async updateReport(reportId: string, updatedReportData: { date: string, text: string, userId: string }): Promise<{ success: boolean; message?: string }> {
    try {
      const reportRef = doc(db, REPORTS_COLLECTION, reportId);
      await updateDoc(reportRef, updatedReportData);
      return { success: true };
    } catch (error: any) {
      console.error("Error updating report:", error.message || error);
      return { success: false, message: "Errore durante l'aggiornamento." };
    }
  },

  async deleteReport(reportId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const reportRef = doc(db, REPORTS_COLLECTION, reportId);
      await deleteDoc(reportRef);
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting report:", error.message || error);
      return { success: false, message: "Errore durante l'eliminazione." };
    }
  },
};