import React from "react";
import { AnimatePresence } from "framer-motion";
import { GameProvider, useGameContext } from "./contexts/GameContext";
import SplashScreen from "./components/SplashScreen";
import RecipeSelection from "./components/RecipeSelection";
import GameplayScreen from "./components/GameplayScreen";
import SummaryScreen from "./components/SummaryScreen";

const GameRouter = () => {
  const { screen } = useGameContext();

  return (
    <AnimatePresence mode="wait">
      {screen === "splash" && <SplashScreen />}
      {screen === "recipe-select" && <RecipeSelection />}
      {screen === "gameplay" && <GameplayScreen />}
      {screen === "summary" && <SummaryScreen />}
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}
