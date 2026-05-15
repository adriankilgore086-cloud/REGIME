/** Minimal typings for dynamic `import("expo-sensors")` in FitnessContext. */
declare module "expo-sensors" {
  export const Pedometer: {
    getStepCountAsync(start: Date, end: Date): Promise<{ steps?: number }>;
  };
}
