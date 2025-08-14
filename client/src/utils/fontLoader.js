// src/utils/fontLoader.js
/**
 * Load application fonts
 * @returns {Promise<void>} Promise that resolves when fonts are loaded
 */
export const loadFonts = async () => {
  if (!("fonts" in document)) {
    return;
  }

  try {
    await Promise.all([document.fonts.load("1em Inter")]);

    document.documentElement.classList.remove("fonts-loading");
    document.documentElement.classList.add("fonts-ready");
  } catch (error) {
    console.error("Error loading fonts:", error);
    // Continue without custom fonts rather than failing
  }
};
