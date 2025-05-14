import { Howl } from "howler";

// Sound effects
const sounds = {
  click: new Howl({
    src: ["/sounds/click.wav"],
    volume: 0.5,
  }),
  success: new Howl({
    src: ["/sounds/success.wav"],
    volume: 0.5,
  }),
  fail: new Howl({
    src: ["/sounds/fail.mp3"],
    volume: 0.5,
  }),
  chop: new Howl({
    src: ["/sounds/chop.wav"],
    volume: 0.5,
  }),
  stir: new Howl({
    src: ["/sounds/stir.wave"],
    volume: 0.5,
  }),
  plate: new Howl({
    src: ["/sounds/plate.wav"],
    volume: 0.5,
  }),
  heat: new Howl({
    src: ["/sounds/heat.wav"],
    volume: 0.5,
  }),
  crack: new Howl({
    src: ["/sounds/crack.mp3"],
    volume: 0.5,
  }),
  whisk: new Howl({
    src: ["/sounds/whisk.wav"],
    volume: 0.5,
  }),
  cook: new Howl({
    src: ["/sounds/cook.mp3"],
    volume: 0.5,
  }),
  flip: new Howl({
    src: ["/sounds/flip.mp3"],
    volume: 0.5,
  }),
  mix: new Howl({
    src: ["/sounds/mix.mp3"],
    volume: 0.5,
  }),
  gameStart: new Howl({
    src: ["/sounds/game-start.wav"],
    volume: 0.5,
  }),
  gameOver: new Howl({
    src: ["/sounds/game-over.mp3"],
    volume: 0.5,
  }),
  bgMusic: new Howl({
    src: ["/sounds/bg-music.mp3"],
    volume: 0.3,
    loop: true,
  }),
};

// Play a sound effect
export const playSound = (soundName) => {
  if (sounds[soundName]) {
    sounds[soundName].play();
  }
};

// Stop a sound effect
export const stopSound = (soundName) => {
  if (sounds[soundName]) {
    sounds[soundName].stop();
  }
};

// Play background music
export const playMusic = () => {
  sounds.bgMusic.play();
};

// Stop background music
export const stopMusic = () => {
  sounds.bgMusic.stop();
};

// Play a step sound based on the step name
export const playStepSound = (step) => {
  const stepLower = step.toLowerCase();
  if (sounds[stepLower]) {
    sounds[stepLower].play();
  } else {
    // Default to click sound if step sound not found
    sounds.click.play();
  }
};
