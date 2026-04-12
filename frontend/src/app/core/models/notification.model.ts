/**
 * @module app/core/models/notification.model
 *
 * **Purpose:** In-app notification records delivered via REST and Socket.IO fan-out.
 *
 * **Responsibilities:** Enumerate notification kinds and describe `INotification` fields including read state.
 *
 * **Integration notes:** Server assigns ids and timestamps; client merges socket payloads into lists without deduplication guarantees.
 */
export enum NotificationType {
  NEW_BOOK = 'NEW_BOOK',
  SUMMARY_READY = 'SUMMARY_READY',
  READING_REMINDER = 'READING_REMINDER',
}

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}
