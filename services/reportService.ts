import { SavedReport, User } from '../types';
import { db } from './firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  FirestoreError,
} from 'firebase/firestore';


const reportsCollection = collection(db, 'reports');

// Helper to compare dates while ignoring time and timezone.
const areDatesEqual = (date1: string, date2: string): boolean => {
    return date1.split('T')[0] === date2.split('T')[0];
};

export const reportService = {
  listenForReports(
    user: User,
    isMasterUser: boolean,
    callback: (reports: SavedReport[]) => void,
    onError: (error: Error) => void
  ): () => void {
    let q;
    if (isMasterUser) {
        // Query for all reports, ordered by date
        q = query(reportsCollection, orderBy('date', 'desc'));
    } else {
        // Query for a specific user's reports, ordered by date
        q = query(reportsCollection, where('userId', '==', user.id), orderBy('date', 'desc'));
    }
    
    const unsubscribe = onSnapshot(q, querySnapshot => {
        const reports = querySnapshot.docs.map(doc => ({
            key: doc.id,
            ...(doc.data() as { date: string, text: string, userId: string }),
        } as SavedReport));
        callback(reports);
    }, (error: FirestoreError) => {
        console.error("Error listening for report updates:", error);
        onError(new Error(error.message));
    });

    return unsubscribe;
  },

  async saveReport(userId: string, report: { date: string, text: string }): Promise<{ success: boolean; message?: string }> {
    try {
      const dataToSave = {
        ...report,
        userId,
      };
      await addDoc(reportsCollection, dataToSave);
      return { success: true };
    } catch (error) {
        console.error("Error saving report:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred while saving.";
        return { success: false, message };
    }
  },
  
  async updateReport(reportKey: string, report: { date: string, text: string, userId: string }): Promise<{ success: boolean; message?: string }> {
    try {
      const reportDocRef = doc(db, 'reports', reportKey);
      await updateDoc(reportDocRef, report);
      return { success: true };
    } catch (error) {
        console.error("Error updating report:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred while updating.";
        return { success: false, message };
    }
  },

  async deleteReport(reportKey: string): Promise<{ success: boolean; message?: string }> {
    try {
      const reportDocRef = doc(db, 'reports', reportKey);
      await deleteDoc(reportDocRef);
      return { success: true };
    } catch (error) {
      console.error("Error deleting report:", error);
      const message = error instanceof Error ? error.message : "An unknown error occurred while deleting.";
      return { success: false, message };
    }
  },
  
  async checkDateConflict(userId: string, dateToCheck: string, currentReportKey: string | null): Promise<SavedReport | null> {
    try {
      const q = query(reportsCollection, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
          // Ensure we are not checking the report against itself
          if (doc.id !== currentReportKey) {
              const reportData = doc.data() as { date: string, text: string, userId: string };
              if (areDatesEqual(reportData.date, dateToCheck)) {
                  return { key: doc.id, ...reportData }; // Conflict found
              }
          }
      }
      
      return null; // No conflict
    } catch (error) {
        console.error("Error checking for date conflict:", error);
        // Returning null prevents a crash. The subsequent save/update operation will likely fail,
        // but that failure will be handled gracefully by the updated service methods.
        return null;
    }
  },
};