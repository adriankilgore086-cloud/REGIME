import { useCallback, useState } from "react";
import type { RewardData } from "@store/FitnessContext";

export function useRewards() {
  const [showReward, setShowReward] = useState(false);
  const [rewardData, setRewardData] = useState<RewardData | null>(null);

  const showRewardOverlay = useCallback((data: RewardData) => {
    setRewardData(data);
    setShowReward(true);
  }, []);

  const dismissReward = useCallback(() => {
    setShowReward(false);
    setRewardData(null);
  }, []);

  return { showReward, rewardData, showRewardOverlay, dismissReward };
}
