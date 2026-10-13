// ========================================
// YUYU.EXE — interactive birthday website
// ========================================

const CONFIG = {
  password: "yuyu",

  secretHint: "Hint: something we have in common...",

  secretImage: {
    src: "assets/images/secret-memory-placeholder.svg",
    alt: "A little memory saved just for you.",
    caption: "a tiny memory, saved here ♡",
  },

  finalImage: {
    src: "assets/images/final-photo-placeholder.svg",
    alt: "The final birthday surprise.",
    caption: "happy birthday, yuyu! ♡",
  },

  gallery: [
    {
      src: "assets/images/field-trip-01-placeholder.svg",
      alt: "First picture in the little album.",
      caption: "little memory no. 01",
    },
    {
      src: "assets/images/field-trip-02-placeholder.svg",
      alt: "Second picture in the little album.",
      caption: "little memory no. 02",
    },
    {
      src: "assets/images/field-trip-03-placeholder.svg",
      alt: "Third picture in the little album.",
      caption: "little memory no. 03",
    },
  ],

  notes: [
    {
      fileName: "a_small_note.txt",
      body: "hi yuyu :)\n\nthis is a tiny corner of the internet made for your birthday.\n\nI hope this little surprise makes you smile. ♡",
    },
    {
      fileName: "random_thought.txt",
      body: "some things are small but still make a day better.\n\nlike finding a song you love, seeing a silly cat, or getting a message at just the right time.\n\nthis file is one of those little things.",
    },
    {
      fileName: "tiny_details.txt",
      body: "a few reminders:\n\n- you're allowed to take things slowly\n- drink some water, okay?\n- save the cute pictures\n- have a little treat today\n\nbirthday rules. very official.",
    },
  ],

  catMessages: [
    "meow.exe is running",
    "you found me!!",
    "no thoughts, just naps",
    "pspspsps...",
    "system status: cute",
    "this cat approves of you",
    "have a tiny happy day ♡",
    "error 404: one braincell missing",
  ],
};


// ========================================
// STATE
// ========================================

const state = {
  startupComplete: false,
  explored: {
    littleThings: false,
    fieldTrip: false,
    secretFolder: false,
  },
  finalUnlocked: false,
  secretRevealed: false,
  openWindows: new Map(),
  nextWindowId: 1,
};


// ========================================
// ELEMENTS
// ========================================

const startupScreen = document.querySelector("#startupScreen");
const startButton = document.querySelector("#startButton");
const desktop = document.querySelector("#desktop");

const progressText = document.querySelector("#progressText");
const unlockDot = document.querySelector("#unlockDot");
const desktopMessage = document.querySelector("#desktopMessage");

const windowTemplate = document.querySelector("#appWindowTemplate");
const lightboxTemplate = document.querySelector("#lightboxTemplate");


// ========================================
// STARTUP
// ========================================


function startExperience() {
  startupScreen.classList.add("is-closing");

  window.setTimeout(() => {
    startupScreen.hidden = true;

    desktop.hidden = false;
    desktop.classList.remove("is-hidden");
    desktop.classList.add("is-visible");
    state.startupComplete = true;
  }, 350);
}



// ========================================
// DESKTOP FOLDERS
// ========================================

function openFolder(folderName) {
  if (!state.startupComplete) return;

  if (folderName === "openLast" && !state.finalUnlocked) {
    showDesktopMessage(
      "hmm... this folder is still locked. explore a little first ♡"
    );
    return;
  }

  switch (folderName) {
    case "littleThings":
      createWindow("littleThings", renderLittleThings);
      markExplored("littleThings");
      break;

    case "fieldTrip":
      createWindow("fieldTrip", renderFieldTrip);
      markExplored("fieldTrip");
      break;

    case "secretFolder":
      createWindow("secretFolder", renderSecretFolder);
      markExplored("secretFolder");
      break;

    case "openLast":
      createWindow("openLast", renderOpenLast);
      break;

    default:
      console.warn(`Unknown folder: ${folderName}`);
  }
}


function getWindowTitle(folderName) {
  const titles = {
    littleThings: "little_things",
    fieldTrip: "field_trip_album",
    secretFolder: "private_folder",
    openLast: "one_last_thing",
  };

  return titles[folderName] || "untitled_window";
}


// ========================================
// WINDOW SYSTEM
// ========================================

function createWindow(folderName, renderContent) {
  if (!windowTemplate) {
    console.error("Window template not found in HTML.");
    return;
  }

  const fragment = windowTemplate.content.cloneNode(true);
  const windowElement = fragment.querySelector(".app-window");

  if (!windowElement) {
    console.error("The window template needs an .app-window element.");
    return;
  }

  const windowId = state.nextWindowId++;

  windowElement.dataset.windowId = String(windowId);
  windowElement.dataset.folder = folderName;

  const titleElement = windowElement.querySelector("#windowTitle");
  const closeButton = windowElement.querySelector(".window-close");
  const contentElement = windowElement.querySelector(".window-content");

  if (titleElement) {
    titleElement.textContent = getWindowTitle(folderName);
    titleElement.id = `windowTitle-${windowId}`;
    windowElement.setAttribute(
      "aria-labelledby",
      `windowTitle-${windowId}`
    );
  }

  if (closeButton) {
    closeButton.setAttribute(
      "aria-label",
      `Close ${getWindowTitle(folderName)}`
    );

    closeButton.addEventListener("click", () => {
      closeWindow(windowId);
    });
  }

  if (contentElement) {
    renderContent(contentElement);
  }

  const layer = document.querySelector("#windowLayer");

  if (!layer) {
    console.error("Window layer #windowLayer not found in HTML.");
    return;
  }

  layer.appendChild(fragment);

  const insertedWindow = layer.querySelector(
    `[data-window-id="${windowId}"]`
  );

  if (!insertedWindow) return;

  state.openWindows.set(windowId, insertedWindow);

  insertedWindow.addEventListener("pointerdown", () => {
    bringWindowToFront(insertedWindow);
  });

  bringWindowToFront(insertedWindow);

  window.setTimeout(() => {
    closeButton?.focus();
  }, 50);
}


function closeWindow(windowId) {
  const windowElement = state.openWindows.get(windowId);

  if (!windowElement) return;

  windowElement.classList.add("is-closing");

  window.setTimeout(() => {
    windowElement.remove();
    state.openWindows.delete(windowId);
  }, 180);
}


function bringWindowToFront(windowElement) {
  let highestZIndex = 10;

  state.openWindows.forEach((element) => {
    const currentZ = Number.parseInt(
      window.getComputedStyle(element).zIndex,
      10
    );

    if (Number.isFinite(currentZ)) {
      highestZIndex = Math.max(highestZIndex, currentZ);
    }
  });

  windowElement.style.zIndex = String(highestZIndex + 1);
}


// ========================================
// LITTLE THINGS FOLDER
// ========================================

function renderLittleThings(panel) {
  const heading = createElement("h4", "a few little things ♡");
  const intro = createElement(
    "p",
    "just some tiny files for you to open. nothing too serious."
  );

  panel.append(heading, intro);

  const fileList = createElement("div", "", "file-list");

  CONFIG.notes.forEach((note) => {
    const fileButton = createElement("button", "", "file-item");
    fileButton.type = "button";

    const icon = createElement("span", "TXT", "file-icon");
    const name = createElement("span", note.fileName, "file-name");
    const arrow = createElement("span", "↗", "file-arrow");

    fileButton.append(icon, name, arrow);

    fileButton.addEventListener("click", () => {
      showTextFile(panel, note);
    });

    fileList.appendChild(fileButton);
  });

  panel.appendChild(fileList);
}


function showTextFile(panel, note) {
  let preview = panel.querySelector(".text-file-preview");

  if (!preview) {
    preview = createElement("section", "", "text-file-preview");
    preview.setAttribute("aria-live", "polite");
    panel.appendChild(preview);
  }

  preview.replaceChildren();

  const title = createElement("h5", note.fileName);
  const body = createElement("p", note.body, "text-file-body");

  const closePreview = createElement("button", "close file", "small-button");
  closePreview.type = "button";
  closePreview.addEventListener("click", () => {
    preview.remove();
  });

  preview.append(title, body, closePreview);
  preview.scrollIntoView({ behavior: "smooth", block: "nearest" });
}


// ========================================
// FIELD TRIP GALLERY
// ========================================

function renderFieldTrip(panel) {
  panel.append(
    createElement("h4", "the little album"),
    createElement(
      "p",
      "a tiny collection of pictures. tap one to see it better."
    )
  );

  const gallery = createElement("div", "", "photo-gallery");

  CONFIG.gallery.forEach((photo, index) => {
    const figure = createElement("figure", "", "gallery-item");

    const imageButton = createElement("button", "", "gallery-image-button");
    imageButton.type = "button";
    imageButton.setAttribute("aria-label", `Open picture ${index + 1}`);

    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = photo.alt;
    image.loading = "lazy";

    image.addEventListener("error", () => {
      showImageFallback(image, "picture not found :(");
    }, { once: true });

    imageButton.appendChild(image);

    imageButton.addEventListener("click", () => {
      openLightbox(photo);
    });

    const caption = createElement("figcaption", photo.caption);

    figure.append(imageButton, caption);
    gallery.appendChild(figure);
  });

  panel.appendChild(gallery);
}


// ========================================
// SECRET FOLDER
// ========================================

function renderSecretFolder(panel) {
  panel.append(
    createElement("h4", "private folder"),
    createElement(
      "p",
      "this folder needs a little password. take a guess?"
    )
  );

  const form = createElement("form", "", "password-form");

  const label = createElement("label", "password");
  const input = document.createElement("input");

  input.type = "password";
  input.name = "password";
  input.placeholder = "type it here...";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.required = true;
  input.setAttribute("aria-label", "Folder password");

  const submitButton = createElement("button", "unlock ♡", "primary-button");
  submitButton.type = "submit";

  const hint = createElement("p", CONFIG.secretHint, "password-hint");
  const message = createElement("p", "", "system-message");

  message.setAttribute("aria-live", "polite");

  label.appendChild(input);
  form.append(label, submitButton, hint, message);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const enteredPassword = input.value.trim().toLowerCase();

    if (enteredPassword === CONFIG.password.toLowerCase()) {
      message.textContent = "access granted ♡";
      message.className = "system-message is-success";

      renderRevealedMemory(panel);
      playBirthdayUnlockEffect();

      state.secretRevealed = true;
      updateProgress();

      input.disabled = true;
      submitButton.disabled = true;
    } else {
      message.textContent = "nope! try another little guess.";
      message.className = "system-message is-error";

      input.value = "";
      input.focus();
    }
  });

  panel.appendChild(form);
}


function renderRevealedMemory(panel) {
  const oldReveal = panel.querySelector(".revealed-memory");
  if (oldReveal) oldReveal.remove();

  const reveal = createElement("section", "", "revealed-memory");

  reveal.append(
    createElement("h4", "you found the secret! ♡"),
    createElement(
      "p",
      "a little something I wanted to leave here for you."
    )
  );

  const imageButton = createElement(
    "button",
    "",
    "revealed-image-button"
  );

  imageButton.type = "button";
  imageButton.setAttribute("aria-label", "Open the secret picture");

  const image = document.createElement("img");
  image.src = CONFIG.secretImage.src;
  image.alt = CONFIG.secretImage.alt;

  image.addEventListener("error", () => {
    showImageFallback(image, "your picture goes here ♡");
  }, { once: true });

  imageButton.appendChild(image);

  imageButton.addEventListener("click", () => {
    openLightbox(CONFIG.secretImage);
  });

  reveal.append(
    imageButton,
    createElement("p", CONFIG.secretImage.caption, "image-caption")
  );

  panel.appendChild(reveal);
  reveal.scrollIntoView({ behavior: "smooth", block: "nearest" });
}


// ========================================
// FINAL SURPRISE
// ========================================

function renderOpenLast(panel) {
  if (!state.finalUnlocked) {
    panel.append(
      createElement("h4", "not yet..."),
      createElement(
        "p",
        "there are still a few things to discover on the desktop."
      )
    );
    return;
  }

  panel.append(
    createElement("h4", "you found the last folder ♡"),
    createElement(
      "p",
      "happy birthday, yuyu!! I made this little corner of the internet just for you."
    ),
    createElement(
      "p",
      "I hope your next year brings you lots of tiny happy moments, good surprises, cute things, and reasons to smile."
    ),
    createElement(
      "p",
      "that's all for now. no big speech, just a little birthday gift from me to you. ♡"
    )
  );

  const imageButton = createElement(
    "button",
    "",
    "final-image-button"
  );

  imageButton.type = "button";
  imageButton.setAttribute("aria-label", "Open the final birthday picture");

  const image = document.createElement("img");
  image.src = CONFIG.finalImage.src;
  image.alt = CONFIG.finalImage.alt;

  image.addEventListener("error", () => {
    showImageFallback(image, "your birthday picture goes here ♡");
  }, { once: true });

  imageButton.appendChild(image);

  imageButton.addEventListener("click", () => {
    openLightbox(CONFIG.finalImage);
  });

  panel.append(
    imageButton,
    createElement("p", CONFIG.finalImage.caption, "image-caption")
  );

  const littleSignoff = createElement(
    "p",
    "end of file. beginning of a new year. ♡",
    "final-signoff"
  );

  panel.appendChild(littleSignoff);

  playBirthdayUnlockEffect();
}


// ========================================
// EXPLORATION PROGRESS
// ========================================

function markExplored(folderName) {
  if (!(folderName in state.explored)) return;

  state.explored[folderName] = true;

  const allExplored = Object.values(state.explored).every(Boolean);

  if (allExplored && !state.finalUnlocked) {
    state.finalUnlocked = true;

    showDesktopMessage(
      "all folders explored!! the last one is unlocked ♡"
    );

    updateProgress();
    playBirthdayUnlockEffect();
    return;
  }

  updateProgress();
}


function updateProgress() {
  const exploredCount = Object.values(state.explored).filter(Boolean).length;

  if (progressText) {
    progressText.textContent = state.finalUnlocked
      ? "3/3 folders explored · everything unlocked ♡"
      : `${exploredCount}/3 folders explored`;
  }

  if (unlockDot) {
    unlockDot.classList.toggle("is-unlocked", state.finalUnlocked);
    unlockDot.setAttribute(
      "aria-label",
      state.finalUnlocked ? "Final folder unlocked" : "Final folder locked"
    );
  }

  const finalFolderButton = document.querySelector(
    '[data-folder="openLast"]'
  );

  if (finalFolderButton) {
    finalFolderButton.classList.toggle("is-unlocked", state.finalUnlocked);
    finalFolderButton.setAttribute(
      "aria-disabled",
      String(!state.finalUnlocked)
    );
  }
}


function showDesktopMessage(text) {
  if (!desktopMessage) return;

  desktopMessage.textContent = text;
  desktopMessage.classList.remove("is-visible");

  // Restart the small message animation.
  void desktopMessage.offsetWidth;

  desktopMessage.classList.add("is-visible");
}


// ========================================
// LIGHTBOX
// ========================================

function openLightbox(photo) {
  if (!lightboxTemplate) {
    console.error("Lightbox template not found in HTML.");
    return;
  }

  // Avoid opening more than one lightbox at a time.
  document.querySelector(".lightbox")?.remove();

  const fragment = lightboxTemplate.content.cloneNode(true);
  const lightbox = fragment.querySelector(".lightbox");

  if (!lightbox) return;

  const image = lightbox.querySelector("img");
  const caption = lightbox.querySelector("figcaption");
  const closeButton = lightbox.querySelector(".lightbox-close");

  if (image) {
    image.src = photo.src;
    image.alt = photo.alt;

    image.addEventListener("error", () => {
      showImageFallback(image, "picture not found :(");
    }, { once: true });
  }

  if (caption) {
    caption.textContent = photo.caption;
  }

  const closeLightbox = () => {
    lightbox.remove();
    document.removeEventListener("keydown", handleEscape);
  };

  const handleEscape = (event) => {
    if (event.key === "Escape") {
      closeLightbox();
    }
  };

  closeButton?.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", handleEscape);

  document.body.appendChild(fragment);
  closeButton?.focus();
}


// ========================================
// IMAGE FALLBACK
// ========================================

function showImageFallback(image, text) {
  const fallback = createElement("div", text, "image-fallback");
  fallback.setAttribute("role", "img");
  fallback.setAttribute("aria-label", text);

  image.replaceWith(fallback);
}


// ========================================
// BIRTHDAY UNLOCK EFFECT
// ========================================

function playBirthdayUnlockEffect() {
  const desktopElement = document.querySelector("#desktop");
  if (!desktopElement) return;

  const burst = createElement("div", "", "birthday-burst");
  burst.setAttribute("aria-hidden", "true");

  const symbols = ["♡", "✦", "✧", "⋆", "♥", "✿"];
  const particleCount = 18;

  for (let i = 0; i < particleCount; i += 1) {
    const particle = createElement(
      "span",
      symbols[Math.floor(Math.random() * symbols.length)],
      "birthday-spark"
    );

    const angle = (Math.PI * 2 * i) / particleCount;
    const distance = 45 + Math.random() * 100;

    particle.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--spark-y", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--spark-delay", `${Math.random() * 0.18}s`);

    burst.appendChild(particle);
  }

  desktopElement.appendChild(burst);

  window.setTimeout(() => {
    burst.remove();
  }, 1400);
}


// ========================================
// CAT EASTER EGG
// ========================================

function setupDesktopCat() {
  const catButton = document.querySelector("#desktopCat");
  const catMessage = document.querySelector("#catMessage");

  if (!catButton || !catMessage) return;

  let lastMessageIndex = -1;

  catButton.addEventListener("click", () => {
    let nextIndex;

    do {
      nextIndex = Math.floor(Math.random() * CONFIG.catMessages.length);
    } while (
      CONFIG.catMessages.length > 1 &&
      nextIndex === lastMessageIndex
    );

    lastMessageIndex = nextIndex;
    catMessage.textContent = CONFIG.catMessages[nextIndex];

    catMessage.classList.remove("is-visible");
    void catMessage.offsetWidth;
    catMessage.classList.add("is-visible");
  });
}


// ========================================
// HELPERS
// ========================================

function createElement(tagName, text = "", className = "") {
  const element = document.createElement(tagName);

  if (text !== "") {
    element.textContent = text;
  }

  if (className) {
    element.className = className;
  }

  return element;
}


// ========================================
// INITIALIZE
// ========================================

function initializeYuyuExe() {
  if (!startupScreen || !startButton || !desktop) {
    console.error(
      "YUYU.EXE could not start. Check the startup and desktop IDs in index.html."
    );
    return;
  }

  desktop.hidden = true;

  startButton.addEventListener("click", startExperience);

  document.querySelectorAll("[data-folder]").forEach((button) => {
    button.addEventListener("click", () => {
      openFolder(button.dataset.folder);
    });
  });

  setupDesktopCat();
  updateProgress();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeYuyuExe);
} else {
  initializeYuyuExe();
}
