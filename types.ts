

export interface SavedReport {
  key: string;
  date: string;
  text: string;
  userId: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  isActive: boolean;
  password?: string;
}