import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameContext } from "../contexts/GameContext";
import { playSound, stopMusic } from "../utils/sounds";

const StatCard = ({ label, value, icon, color }) => {
  return (
    <motion.div
      className={`bg-game-background p-2 sm:p-4 rounded-lg border-2 ${color}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring" }}
    >
      <div className="text-xl sm:text-2xl mb-1">{icon}</div>
      <div className="text-xl sm:text-3xl font-display">{value}</div>
      <div className="text-xs sm:text-sm">{label}</div>
    </motion.div>
  );
};

const Achievement = ({ title, description, isEarned }) => {
  return (
    <motion.div
      className={`p-2 sm:p-3 rounded-lg flex items-center space-x-2 sm:space-x-3 ${
        isEarned ? "bg-primary-mustard/20" : "bg-gray-200/50"
      }`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="text-xl sm:text-2xl">{isEarned ? "🏆" : "🔒"}</div>
      <div className="flex-1">
        <div className="font-bold text-sm sm:text-base">{title}</div>
        <div className="text-[10px] xs:text-xs">{description}</div>
      </div>
    </motion.div>
  );
};

// Success level badge component
const SuccessBadge = ({ level }) => {
  let icon = "🍳";
  let color = "bg-gray-200";
  let text = "Failed";

  switch (level) {
    case "excellent":
      icon = "🌟";
      color = "bg-primary-mustard/30";
      text = "Excellent";
      break;
    case "good":
      icon = "✨";
      color = "bg-primary-olive/30";
      text = "Good";
      break;
    case "basic":
      icon = "✅";
      color = "bg-accent-teal/30";
      text = "Basic";
      break;
    default:
      break;
  }

  return (
    <motion.div
      className={`${color} px-3 py-1 rounded-full inline-flex items-center gap-1`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", delay: 0.7 }}
    >
      <span>{icon}</span>
      <span className="font-bold">{text}</span>
    </motion.div>
  );
};

const SummaryScreen = () => {
  const {
    score,
    streak,
    gameStatus,
    successLevel,
    resetGame,
    selectedRecipe,
    perfectSteps,
    comboMultiplier,
    mistakes,
    difficultyLevel,
    customerSatisfaction,
    stats,
  } = useGameContext();

  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    // Play success or fail sound when component mounts
    playSound(gameStatus === "success" ? "success" : "gameOver");
    // Music is already stopped in the GameContext when transitioning to summary screen
  }, [gameStatus]);

  const handlePlayAgain = () => {
    playSound("click");
    // No need to call stopMusic() here as resetGame() will start music on splash screen
    resetGame();
  };

  // Calculate stats
  const totalSteps = selectedRecipe?.steps.length || 1;
  const accuracy = Math.min(
    100,
    Math.round(((totalSteps - mistakes) / totalSteps) * 100)
  );
  const perfectRate = Math.round((perfectSteps / totalSteps) * 100) || 0;

  // Determine rank based on score, difficulty and success level
  const getRank = () => {
    const difficultyMultiplier =
      difficultyLevel === "easy" ? 0.8 : difficultyLevel === "hard" ? 1.5 : 1;
    const adjustedScore = score / difficultyMultiplier;

    // Bonus for excellent success
    const successBonus =
      successLevel === "excellent" ? 30 : successLevel === "good" ? 15 : 0;
    const finalScore = adjustedScore + successBonus;

    if (finalScore >= 150) return { title: "Master Chef", icon: "👨‍🍳" };
    if (finalScore >= 100) return { title: "Sous Chef", icon: "🧑‍🍳" };
    if (finalScore >= 70) return { title: "Line Cook", icon: "🍳" };
    if (finalScore >= 40) return { title: "Prep Cook", icon: "🔪" };
    return { title: "Kitchen Helper", icon: "🧤" };
  };

  const rank = getRank();

  // Define achievements
  const achievements = [
    {
      title: "Perfect Timing",
      description: "Complete at least 3 steps with perfect timing",
      isEarned: perfectSteps >= 3,
    },
    {
      title: "Combo Master",
      description: "Reach a 5x combo streak",
      isEarned: streak >= 5,
    },
    {
      title: "Speed Demon",
      description: "Complete the recipe with more than 50% time remaining",
      isEarned: gameStatus === "success" && customerSatisfaction > 80,
    },
    {
      title: `${
        difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1)
      } Mode Completed`,
      description: `Complete a recipe on ${difficultyLevel} difficulty`,
      isEarned: gameStatus === "success",
    },
    {
      title: "Flawless Victory",
      description: "Complete a recipe with no mistakes",
      isEarned: mistakes === 0 && gameStatus === "success",
    },
    {
      title: "Excellence Award",
      description: "Achieve an 'Excellent' success rating",
      isEarned: successLevel === "excellent",
    },
  ];

  const earnedAchievements = achievements.filter((a) => a.isEarned).length;

  return (
    <motion.div
      className="min-h-screen bg-game-background flex items-center justify-center p-3 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="game-card max-w-md w-full p-4 sm:p-6 md:p-8 text-center"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display mb-2 text-primary-cherry">
            {gameStatus === "success" ? "Order Complete!" : "Order Failed!"}
          </h2>

          <div className="text-4xl sm:text-5xl md:text-6xl my-2 sm:my-4">
            {gameStatus === "success" ? "🎉" : "💥"}
          </div>

          {/* Success Level Badge */}
          {gameStatus === "success" && (
            <div className="mb-3">
              <SuccessBadge level={successLevel} />
            </div>
          )}

          <motion.div
            className="mb-4 sm:mb-6 text-lg sm:text-xl font-display"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            {rank.icon} {rank.title}
          </motion.div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <StatCard
              label="Score"
              value={score}
              icon="🏅"
              color="border-primary-mustard"
            />
            <StatCard
              label="Accuracy"
              value={`${accuracy}%`}
              icon="🎯"
              color="border-primary-olive"
            />
            <StatCard
              label="Best Combo"
              value={`${streak}x`}
              icon="🔥"
              color="border-accent-teal"
            />
            <StatCard
              label="Perfect Steps"
              value={`${perfectRate}%`}
              icon="✨"
              color="border-primary-cherry"
            />
          </div>

          {/* Bonus Points Display */}
          {stats?.bonusPoints > 0 && (
            <motion.div
              className="mb-4 p-2 bg-primary-mustard/20 rounded-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <div className="text-sm font-bold">Bonus Points</div>
              <div className="text-xl font-display">+{stats.bonusPoints}</div>
              <div className="text-xs">Based on your performance quality</div>
            </motion.div>
          )}

          <motion.div
            className="mb-4 sm:mb-6 bg-game-background p-2 sm:p-3 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-sm sm:text-base">Achievements</div>
              <div className="text-xs sm:text-sm">
                {earnedAchievements}/{achievements.length}
              </div>
            </div>

            <AnimatePresence>
              {showAchievements ? (
                <motion.div
                  className="space-y-2"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  {achievements.map((achievement, idx) => (
                    <Achievement
                      key={idx}
                      title={achievement.title}
                      description={achievement.description}
                      isEarned={achievement.isEarned}
                    />
                  ))}
                </motion.div>
              ) : (
                <div className="flex justify-center">
                  <motion.button
                    className="text-xs sm:text-sm text-primary-cherry underline"
                    onClick={() => setShowAchievements(true)}
                    whileHover={{ scale: 1.05 }}
                  >
                    Show Achievements
                  </motion.button>
                </div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="flex flex-col space-y-4">
            <motion.button
              className="game-button"
              onClick={handlePlayAgain}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Play Again
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SummaryScreen;
