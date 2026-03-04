// types.ts
export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'volunteer' | 'organization'; // Extend roles if needed
}