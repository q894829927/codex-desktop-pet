export {};

type PetSettings = {
  alwaysOnTop: boolean;
  launchAtLogin: boolean;
  launchAtLoginSupported: boolean;
};

declare global {
  interface Window {
    petAPI: {
      hide: () => Promise<void>;
      quit: () => Promise<void>;
      getSettings: () => Promise<PetSettings>;
      setAlwaysOnTop: (enabled: boolean) => Promise<boolean>;
      setLaunchAtLogin: (
        enabled: boolean,
      ) => Promise<{ enabled: boolean; supported: boolean }>;
    };
  }
}
