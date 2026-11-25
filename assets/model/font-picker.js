const fontPicker = document.querySelector("#site-font");
if (fontPicker) {
  const root = document.documentElement;
  const saved = root.dataset.displayFont;
  if ([...fontPicker.options].some(option => !option.disabled && option.value === saved)) {
    fontPicker.value = saved;
  }
  fontPicker.closest(".font-picker").hidden = false;
  fontPicker.addEventListener("change", () => {
    root.dataset.displayFont = fontPicker.value;
    try {
      localStorage.setItem("elitax-display-font", fontPicker.value);
    } catch {}
  });
}
