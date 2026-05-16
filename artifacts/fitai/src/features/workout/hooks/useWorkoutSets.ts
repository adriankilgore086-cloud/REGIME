import { useCallback, useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import type { Exercise } from "@features/gamification/constants/workouts";

type WorkoutSetsState = {
  currentExerciseIndex: number;
  currentSet: number;
  totalSets: number;
  isComplete: boolean;
  isResting: boolean;
  completedExercises: Set<number>;
  cardKey: number;
  currentExercise: Exercise | undefined;
  progress: number;
  advanceExercise: () => void;
  advanceSet: () => void;
  resetSession: () => void;
  goBack: () => void;
  finishRest: () => void;
};

export function useWorkoutSets(exercises: Exercise[], visible: boolean): WorkoutSetsState {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [cardKey, setCardKey] = useState(0);

  const currentExercise = exercises[currentExerciseIndex];
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets, 0);

  const resetSession = useCallback(() => {
    setCurrentExerciseIndex(0);
    setIsResting(false);
    setCompletedExercises(new Set());
    setIsComplete(false);
    setCardKey(0);
  }, []);

  useEffect(() => {
    if (!visible) resetSession();
  }, [resetSession, visible]);

  const advanceExercise = useCallback(() => {
    if (!currentExercise) return;

    setCompletedExercises((current) => {
      const next = new Set(current);
      next.add(currentExerciseIndex);
      return next;
    });

    if (currentExerciseIndex < exercises.length - 1) {
      if (currentExercise.restSeconds > 0) {
        setIsResting(true);
      } else {
        setCurrentExerciseIndex((index) => index + 1);
        setCardKey((key) => key + 1);
      }
    } else {
      setIsComplete(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [currentExercise, currentExerciseIndex, exercises.length]);

  const advanceSet = useCallback(() => {
    advanceExercise();
  }, [advanceExercise]);

  const goBack = useCallback(() => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((index) => index - 1);
      setCardKey((key) => key + 1);
    }
  }, [currentExerciseIndex]);

  const finishRest = useCallback(() => {
    setIsResting(false);
    setCurrentExerciseIndex((index) => index + 1);
    setCardKey((key) => key + 1);
  }, []);

  return {
    currentExerciseIndex,
    currentSet: currentExerciseIndex + 1,
    totalSets,
    isComplete,
    isResting,
    completedExercises,
    cardKey,
    currentExercise,
    progress: exercises.length > 0 ? completedExercises.size / exercises.length : 0,
    advanceExercise,
    advanceSet,
    resetSession,
    goBack,
    finishRest,
  };
}
