import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const LATENCY_OPTIONS = [0, 300, 1500] as const;
export type Latency = (typeof LATENCY_OPTIONS)[number];

interface DevState {
  /** Artificial network delay applied by every mock service call. */
  latencyMs: Latency;
  /** Probability (0..1) that a mock call rejects, to exercise error states. */
  errorRate: number;
  /** Mock result of the "is the user subscribed?" channel check. */
  channelCheckPasses: boolean;
  panelOpen: boolean;
  setLatency: (latencyMs: Latency) => void;
  setErrorRate: (errorRate: number) => void;
  setChannelCheckPasses: (value: boolean) => void;
  setPanelOpen: (panelOpen: boolean) => void;
}

export const useDevStore = create<DevState>()(
  persist(
    (set) => ({
      latencyMs: 300,
      errorRate: 0,
      channelCheckPasses: true,
      panelOpen: false,
      setLatency: (latencyMs) => set({ latencyMs }),
      setErrorRate: (errorRate) => set({ errorRate }),
      setChannelCheckPasses: (channelCheckPasses) => set({ channelCheckPasses }),
      setPanelOpen: (panelOpen) => set({ panelOpen }),
    }),
    {
      name: 'testhub.dev.v1',
      partialize: (state) => ({
        latencyMs: state.latencyMs,
        errorRate: state.errorRate,
        channelCheckPasses: state.channelCheckPasses,
      }),
    },
  ),
);

/** Read outside React (mock services live below the component tree). */
export function devSettings() {
  const { latencyMs, errorRate, channelCheckPasses } = useDevStore.getState();
  return { latencyMs, errorRate, channelCheckPasses };
}
