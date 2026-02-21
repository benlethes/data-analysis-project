# Data Analysis Project: Sound Visualization

An interactive, browser-based audio visualization tool developed as a project the University of Vienna. Users can upload an audio file, select a built-in demo track, or connect a microphone and watch their audio transformed into real-time visual art across six distinct visualization modes.

---

## Project Structure

```
project/
├── index.html              # Page structure, UI controls, and welcome modal
├── sketch.js               # All audio analysis and visualization logic (p5.js)
├── style.css               # Layout, theming, and responsive design
├── demo1_classical.mp3     # Built-in demo track 1
└── demo2_electronic.mp3    # Built-in demo track 2
```

---

## File Descriptions

### index.html

The HTML file defines every visible element of the interface and wires up the welcome modal logic. It loads two external libraries from a CDN: p5.js (v1.7.0) for creative coding and p5.sound for audio analysis. The page is divided into three structural regions:

- **Top bar**: Project title, an Info button that reopens the welcome modal, and a Fullscreen button.
- **Canvas container**: The drawing surface where all visualizations are rendered. Its size is calculated dynamically by sketch.js at startup.
- **Controls bar**: Five labeled control groups (Input Source, Transport, Visualization, Color Palette, Reactivity) built with standard HTML form elements — a select dropdown, file input, buttons, a checkbox, and a range slider.

Two secondary UI elements are managed with CSS classes: a floating "Exit Fullscreen" button that appears only when fullscreen is active, and a small "AUDIO CONTEXT SUSPENDED" warning banner that appears when the browser has blocked audio autoplay.

The welcome modal is a self-contained overlay with an intro, usage instructions, and a description of all visualization modes. It opens on first load and can be reopened via the Info button. Closing it (via the X button, the "Let's go" button, or clicking outside the modal) is handled by a short inline script that adds a CSS animation class before hiding the overlay.

The `sketch.js` file is loaded at the very end of the body so that all DOM elements exist before the script tries to access them.

---

### sketch.js

This is the core logic file. It is written using the p5.js global mode API, which provides functions like `setup()`, `draw()`, and helper utilities for math, color, and drawing.

#### Initialization (setup)

`setup()` runs once when the page loads. It reads the canvas container's dimensions, creates a 16:9 canvas inside it, and initializes three p5.sound objects: a microphone input (`p5.AudioIn`), an FFT analyzer (`p5.FFT` with 2048 bins and 0.8 smoothing), and an amplitude analyzer (`p5.Amplitude`). A secondary off-screen graphics buffer (`spectrogramBuffer`) is created for the Spectrogram visualization, which requires a persistent pixel history. A 1-second interval is also started to check whether the browser's Web Audio context is running and resume it if not.

#### Audio Analysis (draw)

`draw()` is called by p5.js at up to 60 frames per second. At the start of each frame it checks whether audio is currently active — either the microphone is live or a sound file is playing — and if so, extracts three frequency band energies (bass: 20-140 Hz, mid: 140-2600 Hz, treble: 2600-20000 Hz) and a volume level. The intensity multiplier is read from the slider on every frame, so moving the slider takes effect immediately without any reset. The full FFT spectrum array is also retrieved and passed to visualizations that need raw bin data (Spectrogram and Rimington). The appropriate drawing function is then called based on the selected visualization style.

#### Color System

All color output goes through `getPaletteColor(index)`, which reads from the globally selected palette. Eight palettes are defined as arrays of RGB triplets:

| Palette | Character |
|---|---|
| Bauhaus | Bold primaries: purple, yellow, orange, blue, red |
| Cyber | Vibrant neons: magenta, cyan, yellow, green |
| Carbon | Monochrome blacks and greys |
| Sunset | Warm tones: orange, red, purple |
| Ocean | Cool blues and cyans |
| Earth | Natural browns and tans |
| Midnight | Deep purples and indigos |

A separate background/foreground system (`bgVal()` / `fgVal()`) returns 0 or 255 depending on the dark background toggle, keeping labels and lines readable regardless of theme.

#### Controls (setupControls)

All UI event handlers are registered inside `setupControls()`, which is called from `setup()`. Key behaviors:

- Switching the audio source dropdown stops any playing sound, stops the microphone, and calls `forceReset()` to clear the canvas and guarantee the draw loop is running.
- The file input creates an object URL for the selected file and passes it to `loadSound()`. The Play button is enabled only after the sound has fully loaded.
- Selecting a demo track calls `loadSound()` with a relative file path. Both FFT and amplitude inputs are pointed at the loaded sound once it is ready.
- The Play button has dual behavior: if the visualization is paused it unpauses and resumes playback; otherwise it starts the microphone or plays the sound file. For microphone mode, `fft.setInput(mic)` is called inside the `mic.start()` callback (not earlier), because p5.sound requires an active stream before routing works. A 300 ms timeout fallback handles browsers that do not fire the callback reliably.
- The Pause button freezes the draw loop with `noLoop()` and pauses sound playback. The canvas is left in its current state as a snapshot.
- Switching visualization styles calls `forceReset()` and `updateConditionalControls()`, which shows or hides the axis toggle (Spectrogram only) and the legend toggle (Rimington only), and disables the color palette selector for Rimington (which uses its own fixed color set).

#### Canvas Reset Logic

Two reset functions exist with different responsibilities:

- `resetCanvas()` clears the canvas pixels, resets the spectrogram buffer, and clears all Rimington particle state. It does not touch `vizPaused`.
- `forceReset()` calls `resetCanvas()` and additionally sets `vizPaused = false` and calls `loop()`, guaranteeing the draw loop is running. This is used when switching source or visualization style.

`windowResized()` handles both normal and fullscreen resize events. When paused, it calls `redraw()` once to repaint the current frame rather than leaving a blank canvas.

---

### style.css

The stylesheet handles layout, theming, and responsive behavior. The page uses CSS Grid to place the top bar, canvas container, and controls bar in a vertical stack. The canvas container grows to fill available space. The controls bar uses a horizontal flex layout that collapses to a vertical stack on narrow screens. CSS custom properties define the accent color and are used consistently for focus states and interactive element highlights. The fullscreen state is managed by adding an `is-fullscreen` class to the body, which hides the top bar and controls bar and expands the canvas container to fill the viewport. The welcome modal uses a fixed overlay with a centered scrollable inner container.

---

## Visualization Modes

### A. Waveform

Draws the raw audio waveform as a continuous line across the full canvas width on a fresh background each frame. Vertical position maps directly to instantaneous amplitude. A faint center line is drawn as a reference. Stroke color comes from the active palette; stroke weight scales with intensity.

### B. Optical Flow

Draws horizontal sine/cosine curve rows that span the full canvas width, cycling through palette colors from top to bottom. Each frame applies a semi-transparent background fill instead of clearing, creating a motion trail. Bass energy controls the amplitude of the curves; mid energy above a threshold adds Perlin noise displacement. When no audio is active the fade-to-background effect continues but no new curves are drawn.

### C. Architect

Accumulates geometric line structures on the canvas without clearing each frame, building up a blueprint-like composition over time. Volume controls how often shapes are generated (the function returns early when volume is below 0.05). Each shape is a five-vertex open path with random right-angle offsets, drawn in the palette's primary color. When volume exceeds 0.7 there is a 10% chance of a full-canvas flash in a secondary palette color. An accent vertical line is added with 50% probability per frame. This visualization is intentionally additive.

### D. Color Blend

Draws semi-transparent rectangles at random positions without clearing the canvas. Volume maps to the number of rectangles drawn per frame and to their opacity. When treble energy exceeds 150, the blend mode switches to HARD_LIGHT for stronger color interaction; otherwise it uses normal BLEND mode.

### E. Spectrogram

Renders a scrolling time-frequency display using the off-screen `spectrogramBuffer`. Each frame, the buffer is shifted one pixel to the left and a new column of pixels is painted on the right edge. Each pixel in the column represents a frequency bin: low frequencies at the bottom, high frequencies at the top. Pixel color is linearly interpolated between the background color and the active palette color based on that bin's amplitude. The canvas then draws the buffer as a full-frame image. When frequency axes are enabled, `drawSpectrogramLabels()` draws labeled horizontal grid lines at standard frequency reference points (50 Hz, 200 Hz, 500 Hz, 1 kHz, 2 kHz, 5 kHz, 10 kHz) with small background-colored label boxes for readability.

### F. Rimington Color Organ

Based on Alexander Wallace Rimington's historical color organ, which assigned spectrum colors to musical notes. The visualization uses Harmonic Product Spectrum (HPS) pitch detection to identify the dominant musical note being played, then spawns colored particles in the color historically associated with that note.

Beat detection compares the current FFT energy (bass + mid) against a slow exponential moving average. When a spike exceeds the average by a sensitivity factor (adjustable via the intensity slider) and a minimum inter-beat gap of 8 frames has passed, `rimSpawnShapes()` creates one to five particles. Each particle has a type (circle, ellipse, rectangle, or ring), random position, size based on energy, drift velocity, growth rate, rotation speed, and an alpha decay rate. All active particles are updated and drawn each frame in `rimUpdateShapes()`. When the legend is visible, `rimDrawLegend()` draws a row of 12 colored swatches along the bottom of the canvas, one per chromatic note, with the currently detected note highlighted and its frequency displayed.

The pitch detection search range is limited to 80-2000 Hz and to the first third of the spectrum to prevent harmonic aliasing. Parabolic interpolation is applied around the HPS peak bin for sub-bin frequency accuracy. This detection method is reliable for monophonic sources but will produce approximate results for complex polyphonic audio.

A fixed color table (`RIMINGTON_COLORS`) maps each of the 12 chromatic pitch classes (C through B) to specific RGB values. This table is independent of the active color palette; the palette selector is disabled when Rimington mode is active.

---

## Audio Context Handling

Browsers require a user gesture before audio can play. p5.js handles this through `userStartAudio()`, which is called inside the Play button handler. A polling interval checks `getAudioContext().state` every second and calls `.resume()` if it is suspended. The "AUDIO CONTEXT SUSPENDED" warning is shown or hidden based on this check.

---

## Browser Compatibility

| Browser | Status |
|---|---|
| Chrome / Edge | Recommended |
| Firefox | Supported |
| Safari | Supported with caveats (requires user interaction for audio; microphone may need HTTPS) |
| iOS Safari / Chrome Mobile | Supported; tap screen once to activate audio context |

Microphone access requires HTTPS on most mobile browsers.

---

## Technologies Used

- **p5.js v1.7.0** — creative coding framework providing the canvas, draw loop, math utilities, and shape drawing functions
- **p5.sound** — p5.js audio addon providing FFT analysis, amplitude measurement, microphone input, and sound file playback
- **Web Audio API** — underlying browser API used by p5.sound for all audio processing
- **Fullscreen API** — used for fullscreen toggle
- **CSS Grid / Flexbox** — page layout and responsive behavior
