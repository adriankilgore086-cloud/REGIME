import { useCallback, useEffect, useRef, useState } from "react";

type TimerState = {
  timeRemaining: number;
  isRunning: boolean;
  isResting: boolean;
  restTimeRemaining: number;
  start: () => void;
  pause: () => void;
  reset: (seconds?: number) => void;
  startRest: (seconds: number) => void;
};

export function useWorkoutTimer(initialSeconds = 0, onComplete?: () => void): TimerState {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const start = useCallback(() => {
    clearTimer();
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTimeRemaining((current) => {
        if (current <= 1) {
          clearTimer();
          setIsRunning(false);
          setIsResting(false);
          onCompleteRef.current?.();
          return 0;
        }

        return current - 1;
      });
    }, 1000);
  }, [clearTimer]);

  const reset = useCallback(
    (seconds = initialSeconds) => {
      clearTimer();
      setTimeRemaining(seconds);
      setIsRunning(false);
      setIsResting(false);
    },
    [clearTimer, initialSeconds],
  );

  const startRest = useCallback(
    (seconds: number) => {
      clearTimer();
      setTimeRemaining(seconds);
      setIsResting(true);
      setIsRunning(true);
    },
    [clearTimer],
  );

  useEffect(() => {
    if (isRunning && !intervalRef.current) {
      start();
    }
  }, [isRunning, start]);

  useEffect(() => clearTimer, [clearTimer]);

  return {
    timeRemaining,
    isRunning,
    isResting,
    restTimeRemaining: isResting ? timeRemaining : 0,
    start,
    pause,
    reset,
    startRest,
  };
}
