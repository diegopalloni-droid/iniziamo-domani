import { SavedReport, User } from '../types';
import { db } from './firebase';

const reportsCollection = db.collection('reports');

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
        q = reportsCollection.orderBy('date', 'desc');
    } else {
        // Query for a specific user's reports, ordered by date
        q = reportsCollection.where('userId', '==', user.id).orderBy('date', 'desc');
    }
    
    const unsubscribe = q.onSnapshot(querySnapshot => {
        const reports = querySnapshot.docs.map(doc => ({
            key: doc.id,
            ...(doc.data() as { date: string, text: string, userId: string }),
        } as SavedReport));
        callback(reports);
    }, error => {
        console.error("Error listening for report updates:", error);
        onError(error);
    });

    return unsubscribe;
  },

  async saveReport(userId: string, report: { date: string, text: string }): Promise<SavedReport> {
    const dataToSave = {
      ...report,
      userId,
    };
    const docRef = await reportsCollection.add(dataToSave);
    return { key: docRef.id, ...dataToSave };
  },
  
  async updateReport(reportKey: string, report: { date: string, text: string, userId: string }): Promise<SavedReport> {
    const reportDocRef = db.collection('reports').doc(reportKey);
    await reportDocRef.update(report);
    return { key: reportKey, ...report };
  },

  async deleteReport(reportKey: string): Promise<void> {
    const reportDocRef = db.collection('reports').doc(reportKey);
    await reportDocRef.delete();
  },
  
  async checkDateConflict(userId: string, dateToCheck: string, currentReportKey: string | null): Promise<SavedReport | null> {
    const q = reportsCollection.where('userId', '==', userId);
    const querySnapshot = await q.get();
    
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
  },
};