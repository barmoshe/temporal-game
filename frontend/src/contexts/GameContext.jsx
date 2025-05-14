import React, { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import { playMusic, stopMusic } from "../utils/sounds";

const socket = io("http://localhost:3000");

const GameContext = createContext();

export const useGameContext = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState({
    screen: "splash", // splash, recipe-select, gameplay, summary
    orderId: "",
    selectedRecipe: null,
    recipes: [
      {
        id: "salad",
        name: "Garden Salad",
        difficulty: 1,
        steps: ["Chop", "Mix", "Plate"],
        image: "/recipes/salad.png",
        ingredients: ["lettuce", "tomato", "cucumber", "dressing"],
      },
      {
        id: "stir-fry",
        name: "Veggie Stir-Fry",
        difficulty: 2,
        steps: ["Chop", "Heat", "Stir", "Plate"],
        image: "/recipes/stir-fry.png",
        ingredients: ["carrot", "broccoli", "pepper", "sauce"],
      },
      {
        id: "breakfast",
        name: "Breakfast Plate",
        difficulty: 3,
        steps: ["Crack", "Whisk", "Cook", "Flip", "Plate"],
        image: "/recipes/breakfast.png",
        ingredients: ["egg", "bread", "butter", "jam"],
      },
    ],
    currentStep: 0,
    orderQueue: [],
    score: 0,
    streak: 0,
    timeRemaining: 100,
    gameStatus: "", // "", "success", "fail"
    successLevel: "none", // "none", "basic", "good", "excellent"
    feedback: "",
    // Game state properties
    difficultyLevel: "normal", // easy, normal, hard
    powerUps: [],
    activePowerUp: null,
    perfectSteps: 0,
    comboMultiplier: 1,
    timeBonus: 0,
    levelProgress: 0,
    customerSatisfaction: 100,
    mistakes: 0,
    // Stats for summary
    stats: {
      completedSteps: 0,
      totalSteps: 0,
      perfectSteps: 0,
      mistakes: 0,
    },
  });

  // Listen for socket events
  useEffect(() => {
    socket.on("orderStarted", ({ orderId }) => {
      setGameState((prev) => ({
        ...prev,
        orderId,
        screen: "gameplay",
        gameStatus: "",
        feedback: "🍳 Cooking started!",
        timeRemaining: getDifficultyTimeLimit(prev.difficultyLevel),
      }));
    });

    socket.on(
      "orderFinished",
      ({ success, successLevel = "basic", stats = {} }) => {
        // Stop background music when transitioning to summary screen
        stopMusic();

        setGameState((prev) => {
          // Calculate bonus points based on success level
          let bonusPoints = 0;
          if (success) {
            switch (successLevel) {
              case "excellent":
                bonusPoints = 50;
                break;
              case "good":
                bonusPoints = 25;
                break;
              case "basic":
                bonusPoints = 10;
                break;
            }
          }

          // Calculate final score with bonus
          const finalScore = prev.score + bonusPoints;

          // Get appropriate feedback message
          const feedbackMessage = getFeedbackMessage(success, successLevel);

          return {
            ...prev,
            screen: "summary",
            gameStatus: success ? "success" : "fail",
            successLevel,
            score: finalScore,
            feedback: feedbackMessage,
            stats: {
              ...stats,
              bonusPoints,
            },
          };
        });
      }
    );

    return () => {
      socket.off("orderStarted");
      socket.off("orderFinished");
    };
  }, []);

  // Get feedback message based on success level
  const getFeedbackMessage = (success, successLevel) => {
    if (!success) return "💥 Order failed!";

    switch (successLevel) {
      case "excellent":
        return "🌟 Outstanding! Perfect order!";
      case "good":
        return "🎉 Great job! Order complete!";
      case "basic":
        return "✅ Order complete!";
      default:
        return "🍳 Order finished!";
    }
  };

  // Get time limit based on difficulty level
  const getDifficultyTimeLimit = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return 120;
      case "hard":
        return 80;
      default:
        return 100; // normal
    }
  };

  // Get score multiplier based on difficulty level
  const getDifficultyMultiplier = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return 0.8;
      case "hard":
        return 1.5;
      default:
        return 1.0; // normal
    }
  };

  // Game actions
  const startGame = () => {
    setGameState((prev) => ({
      ...prev,
      screen: "recipe-select",
      score: 0,
      streak: 0,
      perfectSteps: 0,
      comboMultiplier: 1,
      timeBonus: 0,
      levelProgress: 0,
      customerSatisfaction: 100,
      mistakes: 0,
      powerUps: ["time_freeze", "auto_complete", "double_points"],
      activePowerUp: null,
      stats: {
        completedSteps: 0,
        totalSteps: 0,
        perfectSteps: 0,
        mistakes: 0,
        bonusPoints: 0,
      },
    }));
  };

  const selectRecipe = (recipeId) => {
    const recipe = gameState.recipes.find((r) => r.id === recipeId);
    setGameState((prev) => ({
      ...prev,
      selectedRecipe: recipe,
    }));

    // Start the order workflow with difficulty level
    socket.emit("startOrder", {
      steps: recipe.steps,
      difficulty: gameState.difficultyLevel,
    });
  };

  const completeStep = (timeTaken = 1, isPerfect = false) => {
    const { orderId, selectedRecipe, currentStep, difficultyLevel } = gameState;
    if (!selectedRecipe || currentStep >= selectedRecipe.steps.length) return;

    const step = selectedRecipe.steps[currentStep];
    // Send isPerfect flag to the server
    socket.emit("stepCompleted", { orderId, step, isPerfect });

    setGameState((prev) => {
      // Calculate new streak and combo multiplier
      const newStreak = prev.streak + 1;
      let newComboMultiplier = prev.comboMultiplier;
      if (newStreak % 3 === 0) {
        newComboMultiplier = Math.min(4, newComboMultiplier + 0.5);
      }

      // Calculate score based on difficulty, perfection, and combo
      const baseScore = 10;
      const difficultyMultiplier = getDifficultyMultiplier(difficultyLevel);
      const perfectBonus = isPerfect ? 5 : 0;
      const timeBonus = Math.max(0, 5 - timeTaken);
      const stepScore = Math.round(
        (baseScore + perfectBonus + timeBonus) *
          difficultyMultiplier *
          newComboMultiplier
      );

      // Update perfect steps count
      const newPerfectSteps = isPerfect
        ? prev.perfectSteps + 1
        : prev.perfectSteps;

      // Check if player earned a power-up
      let earnedPowerUp = null;
      if (newPerfectSteps % 5 === 0 && newPerfectSteps > 0) {
        earnedPowerUp = "time_boost";
      }

      // Update stats
      const updatedStats = {
        ...prev.stats,
        completedSteps: prev.stats.completedSteps + 1,
        perfectSteps: isPerfect
          ? prev.stats.perfectSteps + 1
          : prev.stats.perfectSteps,
      };

      return {
        ...prev,
        currentStep: prev.currentStep + 1,
        score: prev.score + stepScore,
        streak: newStreak,
        comboMultiplier: newComboMultiplier,
        perfectSteps: newPerfectSteps,
        feedback: `✅ ${isPerfect ? "Perfect" : "Completed"}: ${step}`,
        timeRemaining:
          prev.activePowerUp === "time_freeze"
            ? prev.timeRemaining
            : Math.min(
                100,
                prev.timeRemaining + (earnedPowerUp === "time_boost" ? 15 : 0)
              ),
        powerUps: earnedPowerUp
          ? [...prev.powerUps, earnedPowerUp]
          : prev.powerUps,
        stats: updatedStats,
      };
    });
  };

  const missStep = () => {
    setGameState((prev) => {
      // Update stats
      const updatedStats = {
        ...prev.stats,
        mistakes: prev.stats.mistakes + 1,
      };

      return {
        ...prev,
        streak: 0,
        comboMultiplier: 1,
        mistakes: prev.mistakes + 1,
        customerSatisfaction: Math.max(0, prev.customerSatisfaction - 10),
        feedback: "❌ Missed step!",
        stats: updatedStats,
      };
    });
  };

  const resetGame = () => {
    setGameState((prev) => ({
      ...prev,
      screen: "splash",
      orderId: "",
      selectedRecipe: null,
      currentStep: 0,
      score: 0,
      streak: 0,
      timeRemaining: 100,
      gameStatus: "",
      successLevel: "none",
      feedback: "",
      perfectSteps: 0,
      comboMultiplier: 1,
      timeBonus: 0,
      levelProgress: 0,
      customerSatisfaction: 100,
      mistakes: 0,
      powerUps: [],
      activePowerUp: null,
      stats: {
        completedSteps: 0,
        totalSteps: 0,
        perfectSteps: 0,
        mistakes: 0,
        bonusPoints: 0,
      },
    }));

    // Restart background music when returning to splash screen
    playMusic();
  };

  // Set difficulty level
  const setDifficulty = (level) => {
    setGameState((prev) => ({
      ...prev,
      difficultyLevel: level,
    }));
  };

  // Activate power-up
  const activatePowerUp = (powerUpType) => {
    // Check if player has this power-up
    if (!gameState.powerUps.includes(powerUpType)) return;

    // Remove power-up from inventory
    setGameState((prev) => {
      const updatedPowerUps = prev.powerUps.filter((p) => p !== powerUpType);

      // Apply power-up effect
      let feedback = "";
      switch (powerUpType) {
        case "time_freeze":
          feedback = "⏱️ Time Freeze activated!";
          break;
        case "auto_complete":
          feedback = "🔄 Auto Complete activated!";
          break;
        case "double_points":
          feedback = "💯 Double Points activated!";
          break;
        case "time_boost":
          feedback = "⚡ Time Boost activated!";
          // Time boost is instant, so we add time directly
          return {
            ...prev,
            powerUps: updatedPowerUps,
            timeRemaining: Math.min(100, prev.timeRemaining + 15),
            feedback,
          };
        default:
          return prev;
      }

      // For non-instant power-ups, set as active
      return {
        ...prev,
        powerUps: updatedPowerUps,
        activePowerUp: powerUpType,
        feedback,
      };
    });

    // For non-instant power-ups, set a timer to deactivate
    if (powerUpType !== "time_boost") {
      setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          activePowerUp: null,
          feedback: `${powerUpType} power-up ended`,
        }));
      }, 5000); // Power-ups last 5 seconds
    }
  };

  // Timer effect
  useEffect(() => {
    let timer;
    if (
      gameState.screen === "gameplay" &&
      gameState.timeRemaining > 0 &&
      gameState.activePowerUp !== "time_freeze"
    ) {
      timer = setInterval(() => {
        setGameState((prev) => {
          const newTimeRemaining = Math.max(0, prev.timeRemaining - 1);

          // Game over when time runs out
          if (newTimeRemaining === 0 && prev.timeRemaining > 0) {
            socket.emit("orderFailed", { orderId: prev.orderId });
          }

          return {
            ...prev,
            timeRemaining: newTimeRemaining,
          };
        });
      }, 100);
    }

    return () => clearInterval(timer);
  }, [gameState.screen, gameState.timeRemaining, gameState.activePowerUp]);

  const value = {
    ...gameState,
    startGame,
    selectRecipe,
    completeStep,
    resetGame,
    missStep,
    activatePowerUp,
    setDifficulty,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
