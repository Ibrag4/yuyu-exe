const CONFIG = {
  password: "yuyu",
  secretHint: "Hint: something we have in common...",
  secretImage: { src: "assets/images/secret-memory-placeholder.svg", alt: "Placeholder image for the private memory.", caption: "Replace this placeholder with the real private memory photo." },
  finalImage: { src: "assets/images/final-photo-placeholder.svg", alt: "Placeholder image for the final birthday surprise.", caption: "Final birthday photo placeholder." },
  gallery: [
    { src: "assets/images/field-trip-01-placeholder.svg", alt: "Placeholder photo one for the field trip album.", caption: "photo_placeholder_01" },
    { src: "assets/images/field-trip-02-placeholder.svg", alt: "Placeholder photo two for the field trip album.", caption: "photo_placeholder_02" },
    { src: "assets/images/field-trip-03-placeholder.svg", alt: "Placeholder photo three for the field trip album.", caption: "photo_placeholder_03" },
  ],
  notes: [
    { fileName: "a_small_note.txt", body: "Placeholder note: replace this with a tiny real message, an inside joke, or a small detail that feels like Yuyu." },
    { fileName: "random_thought.txt", body: "Placeholder thought: keep it short, specific, and gentle. This file is ready for future personalization." },
    { fileName: "tiny_details.txt", body: "Placeholder details: add small observations here later. No invented memories live in this prototype." },
  ],
};

const state = { startupComplete: false, explored: { littleThings: false, fieldTrip: false, secretFolder: false }, finalUnlocked: false, secretRevealed: false, openWindows: new Map() };
const startupScreen = document.querySelector("#startupScreen");
const desktopScreen = document.querySelector("#desktop");
const startButton = document.querySelector("#startButton");
const folderButtons = document.querySelectorAll("[data-folder]");
const windowLayer = document.querySelector("#windowLayer");
const progressText = document.querySelector("#progressText");
const desktopMessage = document.querySelector("#desktopMessage");
const unlockDot = document.querySelector("#unlockDot");
const appWindowTemplate = document.querySelector("#appWindowTemplate");
const lightboxTemplate = document.querySelector("#lightboxTemplate");

startButton.addEventListener("click", startExperience);
folderButtons.forEach((button) => button.addEventListener("click", () => openFolder(button.dataset.folder)));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const lightbox = document.querySelector(".lightbox");
    if (lightbox) lightbox.remove();
  }
});

function startExperience() {
  state.startupComplete = true;
  startupScreen.classList.add("is-hidden");
  desktopScreen.classList.remove("is-hidden");
  desktopMessage.textContent = "System ready. Choose a folder to begin.";
  updateProgress();
}

function openFolder(folderId) {
  if (folderId === "openLast" && !state.finalUnlocked) {
    desktopMessage.textContent = "open_me_last is still locked. Explore the other folders first.";
    return;
  }
  if (state.openWindows.has(folderId)) {
    state.openWindows.get(folderId).focus();
    return;
  }
  const windowElement = createWindow(getWindowTitle(folderId), folderId);
  const content = windowElement.querySelector(".window-content");
  if (folderId === "littleThings") { markExplored("littleThings"); renderLittleThings(content); }
  if (folderId === "fieldTrip") { markExplored("fieldTrip"); renderFieldTrip(content); }
  if (folderId === "secretFolder") { markExplored("secretFolder"); renderSecretFolder(content); }
  if (folderId === "openLast") renderOpenLast(content);
  state.openWindows.set(folderId, windowElement);
  windowLayer.prepend(windowElement);
  windowElement.focus();
}

function getWindowTitle(folderId) {
  return { littleThings: "little_things", fieldTrip: "field_trip", secretFolder: "ACCESS RESTRICTED", openLast: "open_me_last" }[folderId];
}

function createWindow(title, folderId) {
  const fragment = appWindowTemplate.content.cloneNode(true);
  const windowElement = fragment.querySelector(".app-window");
  fragment.querySelector("h3").textContent = title;
  windowElement.tabIndex = -1;
  fragment.querySelector(".window-close").addEventListener("click", () => { windowElement.remove(); state.openWindows.delete(folderId); });
  return windowElement;
}

function renderLittleThings(container) {
  const list = document.createElement("div");
  const panel = document.createElement("div");
  list.className = "file-list";
  panel.className = "text-panel";
  panel.textContent = "Select a file. These are placeholders for future tiny notes.";
  CONFIG.notes.forEach((note) => {
    const button = document.createElement("button");
    button.className = "file-button";
    button.type = "button";
    button.textContent = note.fileName;
    button.addEventListener("click", () => { panel.textContent = note.body; });
    list.append(button);
  });
  container.append(list, panel);
}

function renderFieldTrip(container) {
  const gallery = document.createElement("div");
  gallery.className = "gallery-grid";
  CONFIG.gallery.forEach((photo) => {
    const button = document.createElement("button");
    const image = document.createElement("img");
    const caption = document.createElement("span");
    button.className = "photo-card";
    button.type = "button";
    image.src = photo.src;
    image.alt = photo.alt;
    image.loading = "lazy";
    image.addEventListener("error", () => showImageFallback(image));
    caption.textContent = photo.caption;
    button.addEventListener("click", () => openLightbox(photo));
    button.append(image, caption);
    gallery.append(button);
  });
  container.append(gallery);
}

function renderSecretFolder(container) {
  const panel = document.createElement("div");
  panel.className = "lock-panel";
  panel.innerHTML = `<div class="lock-icon" aria-hidden="true"></div><p>Some memories need a little key.</p><p class="system-message">${CONFIG.secretHint}</p><form class="password-row"><input type="password" autocomplete="off" placeholder="Enter password..." aria-label="Enter password" /><button class="pixel-button" type="submit">UNLOCK</button></form><p class="system-message" data-secret-message></p>`;
  const form = panel.querySelector("form");
  const input = panel.querySelector("input");
  const message = panel.querySelector("[data-secret-message]");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (input.value.trim().toLowerCase() === CONFIG.password.toLowerCase()) {
      state.secretRevealed = true;
      message.textContent = "Access granted. A little memory, just for you.";
      message.className = "system-message is-success";
      renderRevealedMemory(panel);
    } else {
      message.textContent = "Nope! This memory is still locked. Try again :)";
      message.className = "system-message is-error";
    }
  });
  container.append(panel);
  if (state.secretRevealed) renderRevealedMemory(panel);
}

function renderRevealedMemory(panel) {
  if (panel.querySelector(".revealed-memory")) return;
  const wrapper = document.createElement("div");
  const image = document.createElement("img");
  const caption = document.createElement("p");
  const openButton = document.createElement("button");
  const hideButton = document.createElement("button");
  wrapper.className = "revealed-memory";
  image.className = "secret-image";
  image.src = CONFIG.secretImage.src;
  image.alt = CONFIG.secretImage.alt;
  image.addEventListener("error", () => showImageFallback(image));
  caption.className = "placeholder-note";
  caption.textContent = CONFIG.secretImage.caption;
  openButton.className = "pixel-button";
  openButton.type = "button";
  openButton.textContent = "VIEW PHOTO";
  openButton.addEventListener("click", () => openLightbox(CONFIG.secretImage));
  hideButton.className = "file-button";
  hideButton.type = "button";
  hideButton.textContent = "close photo preview";
  hideButton.addEventListener("click", () => wrapper.remove());
  wrapper.append(image, caption, openButton, hideButton);
  panel.append(wrapper);
}

function renderOpenLast(container) {
  const wrapper = document.createElement("div");
  const image = document.createElement("img");
  const caption = document.createElement("p");
  const message = document.createElement("div");
  wrapper.className = "final-preview";
  image.className = "final-photo";
  image.src = CONFIG.finalImage.src;
  image.alt = CONFIG.finalImage.alt;
  image.addEventListener("error", () => showImageFallback(image));
  caption.className = "placeholder-note";
  caption.textContent = CONFIG.finalImage.caption;
  message.className = "text-panel";
  message.textContent = "Birthday message placeholder: write the final personalized note here later.";
  wrapper.append(image, caption, message);
  container.append(wrapper);
}

function markExplored(folderId) {
  if (!state.explored[folderId]) {
    state.explored[folderId] = true;
    updateProgress();
  }
}

function updateProgress() {
  const exploredCount = Object.values(state.explored).filter(Boolean).length;
  progressText.textContent = state.finalUnlocked ? "3/3 files explored - final unlocked" : `${exploredCount}/3 files explored`;
  if (exploredCount === 3 && !state.finalUnlocked) {
    state.finalUnlocked = true;
    const finalFolder = document.querySelector('[data-folder="openLast"]');
    finalFolder.classList.add("is-ready");
    finalFolder.setAttribute("aria-disabled", "false");
    unlockDot.classList.add("is-unlocked");
    desktopMessage.textContent = "new file discovered: open_me_last";
  }
}

function openLightbox(photo) {
  const fragment = lightboxTemplate.content.cloneNode(true);
  const lightbox = fragment.querySelector(".lightbox");
  const image = fragment.querySelector("img");
  const caption = fragment.querySelector("figcaption");
  const closeButton = fragment.querySelector(".lightbox-close");
  image.src = photo.src;
  image.alt = photo.alt;
  image.addEventListener("error", () => showImageFallback(image));
  caption.textContent = photo.caption;
  closeButton.addEventListener("click", () => lightbox.remove());
  lightbox.addEventListener("click", (event) => { if (event.target === lightbox) lightbox.remove(); });
  document.body.append(lightbox);
  closeButton.focus();
}

function showImageFallback(image) {
  image.removeAttribute("src");
  image.alt = `${image.alt} Image file not found yet.`;
}
