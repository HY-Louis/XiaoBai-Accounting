/** Type declarations for the Electron preload API */
export interface ElectronAPI {
  invoke(channel: string, ...args: unknown[]): Promise<unknown>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
