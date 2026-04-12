/**
 * @module app/core/models/user.model
 *
 * **Purpose:** Shared TypeScript contracts for authenticated users, roles, and auth API payloads.
 *
 * **Responsibilities:** Define `UserRole` enum and `IUser` / `IAuthResponse` shapes for compile-time safety across services and guards.
 *
 * **Integration notes:** Role strings must stay aligned with backend serialization (`USER`/`ADMIN`).
 */
export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
  }
  
  export interface IUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: UserRole;
    oauthProvider: string | null;
    oauthId: string | null;
    isBlocked: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface IAuthResponse {
    user: IUser;
    accessToken: string;
    refreshToken: string;
  }