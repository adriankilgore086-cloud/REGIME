import { useCallback, useState } from "react";

type WorkoutCompletionOptions = {
  scheduledId: string | null;
  onComplete: (scheduledId: string) => void;
  onClose: () => void;
};

export function useWorkoutCompletion({ scheduledId, onComplete, onClose }: WorkoutCompletionOptions) {
  const [isCompleting, setIsCompleting] = useState(false);

  const completeWorkout = useCallback(() => {
    setIsCompleting(true);
    try {
      if (scheduledId) onComplete(scheduledId);
      onClose();
    } finally {
      setIsCompleting(false);
    }
  }, [onClose, onComplete, scheduledId]);

  return { completeWorkout, isCompleting };
}
