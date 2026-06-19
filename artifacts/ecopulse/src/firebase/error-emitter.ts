type Listener = (...args: unknown[]) => void;

class BrowserEventEmitter {
  private listeners: Map<string, Listener[]> = new Map();

  on(event: string, listener: Listener): this {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(listener);
    return this;
  }

  off(event: string, listener: Listener): this {
    const list = this.listeners.get(event);
    if (list)
      this.listeners.set(
        event,
        list.filter((l) => l !== listener)
      );
    return this;
  }

  emit(event: string, ...args: unknown[]): boolean {
    const list = this.listeners.get(event);
    if (!list || list.length === 0) return false;
    list.forEach((l) => l(...args));
    return true;
  }
}

/** Singleton event emitter for broadcasting Firebase/Firestore errors to the UI layer. */
export const errorEmitter = new BrowserEventEmitter();
