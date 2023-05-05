export interface LoginInputs {
  email: string;
  passwd: string;
}

export interface JoinInputs extends LoginInputs {
  nickname: string;
}

export interface IUser {
  email: string;
  nickname: string;
  userRank: string;
  userPoint: number;
  userId?: number;
  isAdmin?: boolean;
  accesstoken?: string;
  refreshtoken?: string;
}
