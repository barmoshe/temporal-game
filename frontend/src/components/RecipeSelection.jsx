import React, { useState } from "react";
import { motion } from "framer-motion";
import { useGameContext } from "../contexts/GameContext";
import { playSound, stopMusic } from "../utils/sounds";

const RecipeCard = ({ recipe, isSelected, onClick }) => {
  const { id, name, difficulty, steps, image } = recipe;

  // Create difficulty stars
  const difficultyStars = Array(difficulty).fill("⭐").join("");

  return (
    <motion.div
      className={`recipe-card ${
        isSelected ? "border-4 border-accent-teal" : ""
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-primary-mustard/20 mb-2 sm:mb-4 flex items-center justify-center overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl sm:text-5xl md:text-6xl">
              {id === "salad" ? "🥗" : id === "stir-fry" ? "🥘" : "🍳"}
            </span>
          )}
        </div>

        <h3 className="text-lg sm:text-xl font-display mb-1 sm:mb-2">{name}</h3>
        <div className="text-xs sm:text-sm mb-1 sm:mb-2">{difficultyStars}</div>

        <div className="flex flex-wrap justify-center gap-1 sm:gap-2 mt-1 sm:mt-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-game-background flex items-center justify-center text-xs"
            >
              {step.charAt(0)}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const RecipeSelection = () => {
  const { recipes, selectRecipe } = useGameContext();
  const [selectedId, setSelectedId] = useState(null);

  const handleRecipeSelect = (recipeId) => {
    playSound("click");
    setSelectedId(recipeId);
  };

  const handleStartCooking = () => {
    if (selectedId) {
      playSound("click");
      selectRecipe(selectedId);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-game-background p-4 sm:p-6 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.h1
        className="text-2xl sm:text-3xl md:text-4xl font-display text-center mb-4 sm:mb-6 md:mb-8 text-primary-cherry"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        Choose Your Recipe
      </motion.h1>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isSelected={selectedId === recipe.id}
              onClick={() => handleRecipeSelect(recipe.id)}
            />
          ))}
        </div>

        <div className="flex justify-center">
          <motion.button
            className={`game-button ${
              !selectedId ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!selectedId}
            onClick={handleStartCooking}
            whileHover={selectedId ? { scale: 1.05 } : {}}
            whileTap={selectedId ? { scale: 0.95 } : {}}
          >
            Start Cooking!
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default RecipeSelection;
