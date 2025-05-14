import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameContext } from "../contexts/GameContext";
import useKeyPress from "../hooks/useKeyPress";
import { playSound, playMusic, stopMusic } from "../utils/sounds";

const DifficultySelector = ({ selectedDifficulty, setSelectedDifficulty }) => {
  return (
    <div className="flex flex-col items-center space-y-4 mb-6">
      <h3 className="text-xl font-display text-primary-cherry">
        Select Difficulty
      </h3>
      <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-4">
        <motion.button
          className={`px-4 py-2 rounded-lg ${
            selectedDifficulty === "easy"
              ? "bg-primary-cherry text-white"
              : "bg-game-surface hover:bg-primary-mustard/50"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedDifficulty("easy")}
        >
          Easy 🟢
        </motion.button>
        <motion.button
          className={`px-4 py-2 rounded-lg ${
            selectedDifficulty === "normal"
              ? "bg-primary-cherry text-white"
              : "bg-game-surface hover:bg-primary-mustard/50"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedDifficulty("normal")}
        >
          Normal 🟡
        </motion.button>
        <motion.button
          className={`px-4 py-2 rounded-lg ${
            selectedDifficulty === "hard"
              ? "bg-primary-cherry text-white"
              : "bg-game-surface hover:bg-primary-mustard/50"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedDifficulty("hard")}
        >
          Hard 🔴
        </motion.button>
      </div>
    </div>
  );
};

const GameInstructions = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-game-surface p-4 xs:p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
      >
        <h2 className="text-xl xs:text-2xl font-display text-primary-cherry mb-4">
          How to Play
        </h2>

        <div className="space-y-4 mb-6">
          <div>
            <h3 className="font-bold">Basic Controls:</h3>
            <p>Press the first letter of each cooking step when prompted.</p>
          </div>

          <div>
            <h3 className="font-bold">Perfect Timing:</h3>
            <p>
              Watch the timing bar and press the key when the marker is in the
              center for bonus points!
            </p>
          </div>

          <div>
            <h3 className="font-bold">Power-ups:</h3>
            <ul className="list-disc pl-5">
              <li>⏱️ Time Freeze - Stops the timer for 10 seconds</li>
              <li>🔄 Auto Complete - Perfect completion for the next step</li>
              <li>💯 Double Points - Double score for the next step</li>
              <li>⏰ Time Boost - Adds 20 seconds to your timer</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold">Combos:</h3>
            <p>
              Complete steps in sequence without mistakes to build your combo
              multiplier!
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <motion.button
            className="game-button"
            onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Got it!
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SplashScreen = () => {
  const { startGame, setDifficulty } = useGameContext();
  const enterPressed = useKeyPress("Enter");
  const [selectedDifficulty, setSelectedDifficulty] = useState("normal");
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (enterPressed && !showInstructions) {
      handleStart();
    }
  }, [enterPressed, showInstructions]);

  useEffect(() => {
    // Stop any existing music before starting background music
    // to prevent overlapping when returning to splash screen
    stopMusic();
    playMusic();
  }, []);

  const handleStart = () => {
    playSound("click");
    setDifficulty(selectedDifficulty);
    startGame();
  };

  return (
    <motion.div
      className="h-screen flex flex-col items-center justify-center bg-game-background px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence>
        {showInstructions && (
          <GameInstructions
            isVisible={showInstructions}
            onClose={() => setShowInstructions(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 15,
        }}
        className="text-center"
      >
        <motion.h1
          className="text-4xl xs:text-5xl sm:text-6xl md:text-8xl font-display text-primary-cherry mb-4 xs:mb-6"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 1, 0, -1, 0],
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 1,
          }}
        >
          Cooking Frenzy
        </motion.h1>

        <motion.div
          className="relative w-40 h-40 xs:w-48 xs:h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 mx-auto mb-6 xs:mb-8"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          {/* Add a circular background with cooking icons */}
          <div className="absolute inset-0 rounded-full bg-primary-mustard/20 flex items-center justify-center">
            <span className="text-6xl xs:text-7xl sm:text-8xl">🍳</span>
          </div>
        </motion.div>

        <DifficultySelector
          selectedDifficulty={selectedDifficulty}
          setSelectedDifficulty={setSelectedDifficulty}
        />

        <div className="flex flex-col space-y-4">
          <motion.button
            className="game-button text-lg xs:text-xl"
            onClick={handleStart}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              y: [0, -5, 0],
              opacity: [0.9, 1, 0.9],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            Press Enter to Start
          </motion.button>

          <motion.button
            className="text-sm text-primary-cherry underline"
            onClick={() => setShowInstructions(true)}
            whileHover={{ scale: 1.05 }}
          >
            How to Play
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-4 text-xs text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Version 2.0 - Improved Gameplay Experience
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
