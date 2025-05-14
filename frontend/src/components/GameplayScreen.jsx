import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameContext } from "../contexts/GameContext";
import { playSound, playStepSound, stopMusic } from "../utils/sounds";
import gsap from "gsap";

// Top bar components
const OrderQueue = () => {
  return (
    <div className="flex space-x-2">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-game-surface shadow-md flex items-center justify-center">
        <span className="text-xl sm:text-2xl">🥗</span>
      </div>
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-game-surface shadow-md flex items-center justify-center">
        <span className="text-xl sm:text-2xl">🥘</span>
      </div>
    </div>
  );
};

const ScoreDisplay = ({ score, streak, comboMultiplier }) => {
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-display text-primary-cherry">
        {score}
      </div>
      {streak > 1 && (
        <motion.div
          className="text-xs sm:text-sm bg-primary-cherry text-white px-2 py-1 rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          {streak}x Combo! ({comboMultiplier.toFixed(1)}x)
        </motion.div>
      )}
    </div>
  );
};

const TimerBar = ({ timeRemaining, activePowerUp }) => {
  // Determine color based on time remaining
  let color = "bg-accent-teal";
  if (timeRemaining < 30) color = "bg-primary-cherry";
  else if (timeRemaining < 70) color = "bg-primary-mustard";

  // Special effect for time freeze
  if (activePowerUp === "time_freeze") {
    color = "bg-blue-400 animate-pulse";
  }

  return (
    <div className="w-full h-3 sm:h-4 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className={`h-full ${color}`}
        initial={{ width: "100%" }}
        animate={{ width: `${timeRemaining}%` }}
        transition={{ type: "tween" }}
      />
    </div>
  );
};

// Power-up components
const PowerUpDisplay = ({ powerUps, activatePowerUp, activePowerUp }) => {
  return (
    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex flex-col space-y-1 sm:space-y-2">
      {powerUps.map((powerUp, idx) => (
        <motion.button
          key={`${powerUp}-${idx}`}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-game-surface shadow-lg flex items-center justify-center hover:bg-primary-mustard transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => activatePowerUp(powerUp)}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          {powerUp === "time_freeze" && "⏱️"}
          {powerUp === "auto_complete" && "🔄"}
          {powerUp === "double_points" && "💯"}
          {powerUp === "time_boost" && "⏰"}
        </motion.button>
      ))}
      {activePowerUp && (
        <div className="text-[10px] xs:text-xs font-bold text-center bg-primary-cherry text-white p-1 rounded-md">
          {activePowerUp.replace("_", " ")}
        </div>
      )}
    </div>
  );
};

// Main game components
const IngredientStation = ({ currentRecipe }) => {
  return (
    <div className="absolute left-2 sm:left-8 top-1/2 transform -translate-y-1/2">
      <div className="game-card p-2 sm:p-4">
        <h3 className="font-display text-base sm:text-lg mb-1 sm:mb-2">
          Ingredients
        </h3>
        <div className="grid grid-cols-2 gap-1 sm:gap-2">
          {currentRecipe?.ingredients.map((ingredient, idx) => (
            <div
              key={idx}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-game-background flex items-center justify-center"
            >
              <span className="text-xl sm:text-2xl">
                {ingredient === "lettuce" && "🥬"}
                {ingredient === "tomato" && "🍅"}
                {ingredient === "cucumber" && "🥒"}
                {ingredient === "dressing" && "🧂"}
                {ingredient === "carrot" && "🥕"}
                {ingredient === "broccoli" && "🥦"}
                {ingredient === "pepper" && "🫑"}
                {ingredient === "sauce" && "🍯"}
                {ingredient === "egg" && "🥚"}
                {ingredient === "bread" && "🍞"}
                {ingredient === "butter" && "🧈"}
                {ingredient === "jam" && "🍓"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ServingWindow = () => {
  return (
    <div className="absolute right-2 sm:right-8 top-1/2 transform -translate-y-1/2">
      <div className="game-card p-2 sm:p-4 w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">🍽️</div>
          <div className="text-xs sm:text-sm font-display">Serving Window</div>
        </div>
      </div>
    </div>
  );
};

const ActionPrompt = ({ step, isActive, status, keyChar, timingIndicator }) => {
  const letter = step.charAt(0).toUpperCase();

  let statusClass = "";
  if (status === "success") statusClass = "action-prompt-success";
  else if (status === "fail") statusClass = "action-prompt-fail";
  else if (isActive) statusClass = "action-prompt-active";

  return (
    <motion.div
      className={`action-prompt ${statusClass} relative`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      layout
    >
      {letter}
      {isActive && timingIndicator > 0 && (
        <motion.div
          className="absolute -bottom-6 left-0 right-0 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-game-surface px-2 py-1 rounded-full text-xs">
            {timingIndicator === 3 && "Perfect!"}
            {timingIndicator === 2 && "Great!"}
            {timingIndicator === 1 && "Good!"}
          </div>
        </motion.div>
      )}
      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full">
        {keyChar}
      </div>
    </motion.div>
  );
};

// Feedback popup component
const FeedbackPopup = ({ message }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-game-surface px-3 py-1 sm:px-4 sm:py-2 rounded-lg shadow-lg text-lg sm:text-xl font-display"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Animation for cooking actions
const animateCookingAction = (step) => {
  const stepLower = step.toLowerCase();

  // Different animations based on step type
  switch (stepLower) {
    case "chop":
      gsap.to("#knife", {
        y: 20,
        rotation: 30,
        duration: 0.2,
        yoyo: true,
        repeat: 3,
        ease: "power2.inOut",
      });
      break;
    case "stir":
      gsap.to("#spoon", {
        rotation: 360,
        transformOrigin: "center",
        duration: 1,
        ease: "power1.inOut",
      });
      break;
    case "plate":
      gsap.to("#plate", {
        x: 100,
        duration: 0.5,
        ease: "back.out(1.7)",
      });
      break;
    default:
      // Generic animation for other steps
      gsap.to("#kitchen-counter", {
        y: -5,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
      });
  }
};

// Perfect timing system
const PerfectTimingIndicator = ({ isActive, timingValue }) => {
  if (!isActive) return null;

  return (
    <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-64 h-8 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full w-full relative">
        <motion.div
          className="absolute top-0 bottom-0 w-4 bg-primary-cherry"
          animate={{
            x: [0, 252, 0],
          }}
          transition={{
            duration: 3,
            ease: "linear",
            repeat: Infinity,
          }}
        />
        <div className="absolute top-0 bottom-0 left-1/2 w-8 transform -translate-x-1/2 bg-accent-teal opacity-30" />
      </div>
    </div>
  );
};

const GameplayScreen = () => {
  const {
    selectedRecipe,
    currentStep,
    score,
    streak,
    comboMultiplier,
    timeRemaining,
    completeStep,
    missStep,
    powerUps,
    activePowerUp,
    activatePowerUp,
    difficultyLevel,
  } = useGameContext();

  const [stepStatus, setStepStatus] = useState("");
  const [feedback, setFeedback] = useState("");
  const [timingIndicator, setTimingIndicator] = useState(0);
  const [perfectTiming, setPerfectTiming] = useState(0);
  const timingRef = useRef(null);

  // Start perfect timing system
  useEffect(() => {
    if (selectedRecipe && currentStep < selectedRecipe.steps.length) {
      let counter = 0;
      timingRef.current = setInterval(() => {
        counter = (counter + 1) % 60;
        // Perfect timing is when counter is between 28-32 (centered at 30)
        setPerfectTiming(counter);
      }, 50);
    }

    return () => {
      if (timingRef.current) {
        clearInterval(timingRef.current);
      }
    };
  }, [selectedRecipe, currentStep]);

  // Handle key presses for step completion
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!selectedRecipe || currentStep >= selectedRecipe.steps.length) return;

      const currentStepName = selectedRecipe.steps[currentStep];
      const firstLetter = currentStepName.charAt(0).toLowerCase();

      if (e.key.toLowerCase() === firstLetter) {
        handleStepComplete();
      } else {
        // Wrong key pressed
        playSound("fail");
        missStep();
        setStepStatus("fail");
        setTimeout(() => {
          setStepStatus("");
        }, 300);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedRecipe, currentStep]);

  // Ensure music is stopped when the gameplay screen loads
  useEffect(() => {
    playSound("gameStart");
  }, []);

  const handleStepComplete = () => {
    if (!selectedRecipe || currentStep >= selectedRecipe.steps.length) return;

    const step = selectedRecipe.steps[currentStep];

    // Determine timing quality (0 = normal, 1 = good, 2 = great, 3 = perfect)
    let timingQuality = 0;
    let isPerfect = false;

    if (perfectTiming >= 28 && perfectTiming <= 32) {
      timingQuality = 3; // Perfect
      isPerfect = true;
    } else if (perfectTiming >= 25 && perfectTiming <= 35) {
      timingQuality = 2; // Great
    } else if (perfectTiming >= 20 && perfectTiming <= 40) {
      timingQuality = 1; // Good
    }

    setTimingIndicator(timingQuality);

    // Play sound and animate
    playStepSound(step.toLowerCase());
    animateCookingAction(step);

    // Update status and complete step
    setStepStatus("success");

    // Auto-complete if power-up is active
    if (activePowerUp === "auto_complete") {
      isPerfect = true;
      timingQuality = 3;
    }

    // Double points if power-up is active
    const timeTaken = activePowerUp === "double_points" ? 0 : 3 - timingQuality;

    setTimeout(() => {
      completeStep(timeTaken, isPerfect);
      setStepStatus("");
      setTimingIndicator(0);

      // Show feedback based on timing
      if (timingQuality === 3) {
        setFeedback("Perfect Timing! +5");
      } else if (timingQuality === 2) {
        setFeedback("Great Timing! +3");
      } else if (timingQuality === 1) {
        setFeedback("Good Timing! +1");
      }

      // Clear feedback after a delay
      setTimeout(() => {
        setFeedback("");
      }, 1000);
    }, 500);
  };

  if (!selectedRecipe) return null;

  return (
    <motion.div
      className="h-screen bg-game-background flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Top Bar */}
      <div className="bg-game-surface p-4 shadow-md grid grid-cols-3 items-center">
        <OrderQueue />
        <ScoreDisplay
          score={score}
          streak={streak}
          comboMultiplier={comboMultiplier}
        />
        <div className="flex-1">
          <TimerBar
            timeRemaining={timeRemaining}
            activePowerUp={activePowerUp}
          />
        </div>
      </div>

      {/* Main Kitchen Stage */}
      <div className="flex-1 relative overflow-hidden">
        {/* Kitchen Background */}
        <div
          id="kitchen-counter"
          className="absolute inset-0 bg-primary-mustard/10 rounded-lg m-4"
        >
          {/* Kitchen Items */}
          <div id="knife" className="absolute left-1/4 top-1/2 text-7xl">
            🔪
          </div>
          <div id="spoon" className="absolute left-1/3 top-1/2 text-7xl">
            🥄
          </div>
          <div id="plate" className="absolute left-1/2 top-1/2 text-7xl">
            🍽️
          </div>
        </div>

        {/* Ingredient Station */}
        <IngredientStation currentRecipe={selectedRecipe} />

        {/* Serving Window */}
        <ServingWindow />

        {/* Recipe Steps */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
          {selectedRecipe.steps.map((step, idx) => (
            <ActionPrompt
              key={idx}
              step={step}
              isActive={idx === currentStep}
              status={
                idx === currentStep
                  ? stepStatus
                  : idx < currentStep
                  ? "success"
                  : ""
              }
              keyChar={step.charAt(0).toLowerCase()}
              timingIndicator={idx === currentStep ? timingIndicator : 0}
            />
          ))}
        </div>

        {/* Perfect Timing Indicator */}
        <PerfectTimingIndicator
          isActive={currentStep < selectedRecipe.steps.length}
          timingValue={perfectTiming}
        />

        {/* Power-ups */}
        <PowerUpDisplay
          powerUps={powerUps}
          activatePowerUp={activatePowerUp}
          activePowerUp={activePowerUp}
        />

        {/* Feedback Popup */}
        <FeedbackPopup message={feedback} />

        {/* Difficulty Indicator */}
        <div className="absolute top-4 left-4 bg-game-surface px-3 py-1 rounded-full text-sm">
          {difficultyLevel === "easy" && "Easy 🟢"}
          {difficultyLevel === "normal" && "Normal 🟡"}
          {difficultyLevel === "hard" && "Hard 🔴"}
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
          Press the first letter of each step to complete it
        </div>
      </div>
    </motion.div>
  );
};

export default GameplayScreen;
