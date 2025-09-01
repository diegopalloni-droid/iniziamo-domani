export interface SavedReport {
  id: string;
  date: string;
  text: string;
  userId: string;
}

export interface User {
  id: string; // This will be the Firebase Auth UID
  username: string;
  email: string;
  name: string;
  isActive: boolean;
  isMaster?: boolean;
}