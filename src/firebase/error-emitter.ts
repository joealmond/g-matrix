import { EventEmitter } from 'events';
import type { FirestorePermissionError } from './errors';

// Define the types of events that can be emitted.
// In this case, we only have one event type: 'permission-error'.
type AppEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// A typed event emitter class that extends the base EventEmitter.
class TypedEventEmitter<T extends Record<string, (...args: any[]) => void>> {
  private emitter = new EventEmitter();

  on<E extends keyof T>(event: E, listener: T[E]): void {
    this.emitter.on(event as string, listener);
  }

  off<E extends keyof T>(event: E, listener: T[E]): void {
    this.emitter.off(event as string, listener);
  }

  emit<E extends keyof T>(event: E, ...args: Parameters<T[E]>): void {
    this.emitter.emit(event as string, ...args);
  }
}

// Create a global instance of the typed event emitter.
// This will be used throughout the application to emit and listen for
// Firestore permission errors.
export const errorEmitter = new TypedEventEmitter<AppEvents>();
