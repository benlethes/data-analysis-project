# Data Analysis Project: Sound Visualization

An interactive web-based audio visualization tool that transforms sound into dynamic visual art. Upload any audio file and watch it come to life through four distinct visualization modes, each responding in real-time to different frequency ranges and amplitude levels.

![Project Banner](docs/banner-placeholder.png)

## 🎯 Project Overview

This project creates real-time audio-reactive visualizations in the browser using p5.js. Users can upload audio files and experience them through multiple visualization styles, each analyzing different aspects of the audio spectrum:

- **Frequency Analysis**: Separates audio into bass, mid, and treble ranges
- **Amplitude Detection**: Tracks overall volume levels
- **Visual Mapping**: Translates audio data into geometric and color-based visuals
- **Interactive Controls**: Customize intensity, colors, and visualization styles


## 📖 User Guide

### Basic Usage

1. **Select Audio File**: Click "Select Audio File" and choose an audio file (MP3, WAV, OGG, etc.)
2. **Press Play**: Start playback and watch the visualization react
3. **Choose Visualization**: Select from 4 different visual styles
4. **Customize Colors**: Pick from 4 color palettes
5. **Adjust Intensity**: Use the reactivity slider to control visual intensity

### Visualization Modes

#### A. Waveform (Standard)
Classic oscilloscope-style visualization showing the raw audio waveform.
- **What it shows**: The actual shape of the sound wave over time
- **Best for**: Seeing the structure of music, vocals, or beats
- **Audio mapping**: Direct amplitude visualization

#### B. Optical Flow (3D Lines)
Creates flowing, fabric-like patterns that warp with the music.
- **What it shows**: Warped horizontal lines creating moiré patterns
- **Best for**: Electronic music, ambient soundscapes
- **Audio mapping**: 
  - Bass → Wave amplitude/distortion
  - Mid frequencies → Glitch effects
  - Time → Z-axis movement creating depth

#### C. Architect (Structure)
Builds up geometric line drawings resembling architectural blueprints.
- **What it shows**: Accumulating abstract "floor plans" and construction lines
- **Best for**: Building suspense, progressive tracks
- **Audio mapping**:
  - Volume → Shard generation rate
  - Treble → Line brightness
  - High hits → White flash strobe effect

#### D. Color Blend (Paint)
Abstract color painting mode using palette-based rectangles.
- **What it shows**: Overlapping colored rectangles with blend modes
- **Best for**: Colorful, energetic music
- **Audio mapping**:
  - Volume → Number of shapes
  - Treble → Blend mode intensity (HARD_LIGHT vs BLEND)
  - Palette selection → Color scheme

### Color Palettes

- **Bauhaus (Primary)**: Bold primary colors (purple, yellow, orange, blue, red)
- **Cyber (Neon/Dark)**: Vibrant neons on dark background (magenta, cyan, yellow, green)
- **Carbon (Greyscale)**: Monochrome blacks and greys for a minimal aesthetic
- **Ether (Pastel)**: Soft pastels (pink, mint, cream, peach, lavender)

### Reactivity Control

The intensity slider adjusts how strongly visuals respond to audio:
- **Subtle (0-25)**: Gentle, understated movements
- **Moderate (25-75)**: Balanced response (default: 50)
- **Extreme (75-100)**: Aggressive, dramatic reactions

## 🔧 Technical Documentation

### File Structure

```
project/
│
├── index.html          # Main HTML structure and UI
├── sketch.js           # p5.js visualization logic
└── README.md          # This file
```

### Technologies Used

- **[p5.js](https://p5js.org/)** (v1.7.0): Creative coding framework
- **[p5.sound.js](https://p5js.org/reference/#/libraries/p5.sound)**: Audio analysis library
- **Vanilla JavaScript**: Core logic
- **CSS Grid**: Responsive layout
- **Google Fonts**: Inter & Space Grotesk typefaces

---

## 📄 Code Documentation

### index.html - Structure Breakdown

#### HTML Structure
```
<body>
  ├── <header>                    # Project title overlay
  ├── <div id="canvas-container"> # Visualization area (16:9)
  ├── <div id="audio-debug">      # Hidden audio context warning
  └── <div id="controls-bar">     # Bottom control panel
      ├── 01. Input Data          # File upload
      ├── 02. Transport           # Play/Pause/Stop
      ├── 03. Visualization       # Style selector
      ├── 04. Color Palette       # Color scheme
      └── 05. Reactivity          # Intensity slider
```

#### CSS Architecture

**Design System**
- Uses CSS custom properties (variables) for theming
- Grid-based layout for responsive controls
- Clean, minimal aesthetic inspired by Bauhaus/Swiss design

**Key Layout Features**
- Canvas maintains 16:9 aspect ratio (cinematic)
- Flexbox centers canvas in available space
- Grid creates 5-column control bar
- All controls have consistent spacing and borders

**Responsive Behavior**
- Canvas resizes based on available window space
- Maintains aspect ratio while fitting container
- Controls remain fixed height at bottom

#### JavaScript Imports
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/addons/p5.sound.min.js"></script>
<script src="sketch.js"></script>
```

---

### sketch.js - Function Reference

#### Global Variables

```javascript
// Audio Objects
let sound;              // p5.SoundFile object for playback
let fft;                // Fast Fourier Transform analyzer
let amplitude;          // Amplitude (volume) analyzer
let audioContextStarted; // Browser audio context status

// Visualization State
let vizStyle;           // Current visualization mode
let intensity;          // Reactivity multiplier (0.5-4.0)
let colorPalette;       // Current color scheme name
```

#### Core p5.js Functions

##### `setup()`
Called once when the program starts.

**What it does:**
1. Calculates optimal canvas size (16:9 ratio)
2. Creates canvas and attaches to DOM container
3. Initializes audio analyzers:
   - `FFT`: Frequency analysis with 1024 bins, 0.8 smoothing
   - `Amplitude`: Volume level detection
4. Sets master output volume to 100%
5. Calls `setupControls()` to bind UI events
6. Starts audio context monitoring

**Technical Details:**
- Uses responsive sizing to fit container while maintaining aspect ratio
- Prioritizes height constraints, then width
- FFT smoothing (0.8) prevents jittery visualizations

##### `draw()`
Called 60 times per second (default frame rate).

**What it does:**
1. Checks if audio is playing
2. If playing:
   - Analyzes frequency spectrum via FFT
   - Extracts bass (20-140 Hz), mid (140-2600 Hz), treble (2600-20000 Hz)
   - Gets overall amplitude level
   - Updates intensity from slider value
3. Routes to appropriate visualization function based on `vizStyle`

**Audio Data Flow:**
```
Audio File → FFT Analyzer → Frequency Bins
                          ↓
          [Bass | Mid | Treble] + Amplitude
                          ↓
              Visualization Function
```

##### `checkAudioState()`
Diagnostic function called every second.

**Purpose:** Detects if the browser's AudioContext is suspended (common in Safari and mobile browsers). Shows a warning banner if audio won't play due to browser autoplay policies.

---

#### Visualization Functions

##### `drawWaveform(vol)`
Creates a traditional oscilloscope display.

**Algorithm:**
1. Clears background to white
2. Gets time-domain waveform data (1024 samples)
3. Maps each sample across canvas width
4. Converts audio values (-1 to 1) to vertical pixel positions
5. Draws continuous curve using `vertex()` points
6. Adds center reference line

**Parameters:**
- `vol`: Current amplitude (0-1), affects line weight via intensity

**Visual Effect:** Shows the actual shape of sound waves, revealing beats, vocals, and transients.

##### `drawOptical(bass, mid)`
Creates warping, 3D-like line patterns.

**Algorithm:**
1. Sets dark background
2. Draws horizontal lines at regular intervals (20px)
3. For each line:
   - Calculates sine/cosine waves based on position and time
   - Applies bass-driven distortion to wave amplitude
   - Adds noise-based "glitch" effect when mid frequencies spike
   - Uses time variable for continuous Z-axis movement

**Parameters:**
- `bass`: Bass energy (0-255) → controls wave distortion amplitude
- `mid`: Mid energy (0-255) → triggers glitch noise when > 100

**Mathematical Model:**
```
distortion = sin(x * 0.02 + time) * cos(y * 0.03 + time) * bassAmplitude
if (mid > threshold):
    distortion += noise(x, y) * midScale
```

**Visual Effect:** Creates flowing, fabric-like patterns that appear to move through 3D space.

##### `drawArchitect(treble, vol)`
Accumulates geometric line structures over time.

**Algorithm:**
1. Only draws when volume exceeds threshold (0.05)
2. Randomly places "floor plan" shards:
   - 5-vertex polygons with 90° angles (architect style)
   - Random size based on intensity
   - Transparent black lines
3. Occasionally draws vertical "construction lines" in blue
4. On high hits (vol > 0.7), flashes white overlay (strobe effect)

**Parameters:**
- `treble`: Treble energy (unused currently, reserved for future brightness control)
- `vol`: Amplitude (0-1) → controls generation rate and strobe

**Key Feature:** **Does not clear background** - structures accumulate creating complex compositions.

**Visual Effect:** Resembles evolving architectural blueprints or deconstructed building plans.

##### `drawPaint(bass, treble, vol)`
Paints colored rectangles with blend modes.

**Algorithm:**
1. Skips drawing if volume too low (< 0.01)
2. Calculates number of shapes based on volume and intensity
3. For each shape:
   - Randomly selects color from current palette
   - Sets alpha transparency based on volume
   - Switches blend mode: `HARD_LIGHT` if treble > 150, else `BLEND`
   - Draws rectangle at random position with random dimensions
4. Resets blend mode to normal

**Parameters:**
- `bass`: Bass energy (unused currently)
- `treble`: Treble energy (0-255) → controls blend mode
- `vol`: Amplitude (0-1) → controls shape count and transparency

**Blend Modes:**
- `BLEND`: Normal overlay (additive transparency)
- `HARD_LIGHT`: High-contrast color mixing (treble-triggered)

**Key Feature:** **Does not clear background** - colors accumulate and mix.

**Visual Effect:** Abstract expressionist painting that builds color density over time.

---

#### UI & Audio Control Functions

##### `setupControls()`
Binds all UI interactions to p5.js and audio objects.

**File Upload Handler:**
```javascript
select('#audioFile').changed(function() {
  // 1. Get file from input
  // 2. Update filename display
  // 3. Stop any existing sound
  // 4. Load new file using Object URL
  // 5. Enable transport buttons when loaded
})
```

**Play Button Handler:**
Critical for cross-browser compatibility, especially Safari:
```javascript
select('#playBtn').mousePressed(() => {
  // 1. Resume AudioContext (required for Safari/mobile)
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
  
  // 2. Force maximum volume (defensive coding)
  outputVolume(1.0);
  sound.setVolume(1.0);
  
  // 3. Start playback
  sound.play();
})
```

**Why this matters:** Modern browsers suspend AudioContext by default until user interaction. This ensures audio actually plays.

**Pause/Stop Handlers:**
- Pause: Pauses audio at current position
- Stop: Stops audio and resets canvas

**Visualization Selector:**
Updates `vizStyle` variable and resets canvas to appropriate background color.

**Color Scheme Selector:**
Updates `colorPalette` variable (affects paint visualization mode).

##### `resetCanvas()`
Clears the canvas to appropriate background color based on visualization mode.

**Logic:**
- Optical mode → Black background
- All other modes → White background

**Called when:**
- Changing visualization style
- Stopping playback
- Resizing window

##### `windowResized()`
p5.js built-in function called automatically when browser window resizes.

**What it does:**
1. Recalculates optimal canvas dimensions
2. Maintains 16:9 aspect ratio
3. Resizes canvas
4. Resets canvas to clean state

**Ensures:** Visualization always fits window without distortion.

---

## 🎨 Audio Analysis Explained

### FFT (Fast Fourier Transform)

**What it does:** Converts time-domain audio (waveform) into frequency-domain data (spectrum).

**How it works:**
1. Takes 1024 audio samples
2. Applies mathematical transform
3. Outputs energy levels for different frequency bins

**Frequency Ranges:**
```
Bass:   20 Hz - 140 Hz    (kick drums, bass guitar)
Mid:    140 Hz - 2600 Hz  (vocals, snares, guitars)
Treble: 2600 Hz - 20kHz   (cymbals, hi-hats, sparkle)
```

**Smoothing:** The 0.8 parameter creates smooth transitions between frames, preventing visual jitter.

### Amplitude Analysis

**What it does:** Measures overall volume level (RMS - Root Mean Square).

**Output:** Value between 0.0 (silence) and 1.0 (maximum volume).

**Used for:** Controlling shape count, triggering effects, adjusting transparency.

---

## 🛠️ Customization Guide

### Adding a New Visualization

1. **Add option to HTML:**
```html
<option value="myViz">E. My Visualization</option>
```

2. **Create visualization function in sketch.js:**
```javascript
function drawMyViz(bass, mid, treble, vol) {
  // Your visualization code here
  // Use background(255) if you want clearing
  // Skip background() for accumulative effects
}
```

3. **Add to draw() routing:**
```javascript
else if (vizStyle === 'myViz') {
  drawMyViz(bass, mid, treble, vol);
}
```

### Adding a New Color Palette

1. **Add to palettes object:**
```javascript
const palettes = {
  // ... existing palettes
  'myPalette': [[R, G, B], [R, G, B], [R, G, B], ...]
};
```

2. **Add option to HTML:**
```html
<option value="myPalette">My Palette Name</option>
```

### Modifying Audio Analysis

**Adjust FFT resolution:**
```javascript
// More bins = more frequency detail (but slower)
fft = new p5.FFT(0.8, 2048);  // Try 512, 1024, 2048, 4096
```

**Adjust smoothing:**
```javascript
// Lower = more reactive, Higher = smoother
fft = new p5.FFT(0.5, 1024);  // Range: 0.0-1.0
```

**Get specific frequency ranges:**
```javascript
let subBass = fft.getEnergy(20, 60);    // Sub bass
let kickDrum = fft.getEnergy(60, 140);  // Kick drum range
let vocals = fft.getEnergy(300, 3000);  // Vocal range
```

---

## 🐛 Troubleshooting

### Audio Won't Play

**Problem:** "AUDIO CONTEXT SUSPENDED" warning appears.

**Solution:**
1. Make sure you clicked the Play button (user interaction required)
2. Check browser console for errors
3. Try refreshing the page and uploading file again
4. Some browsers block autoplay - manual play click is required

### Visualization Not Responding

**Problem:** Graphics display but don't react to music.

**Causes & Solutions:**
- **File not loaded:** Wait for "File Loaded. Press Play." message
- **Volume too low:** Check intensity slider and audio file volume
- **Silent audio section:** Visualizations respond to actual audio content
- **Browser issue:** Try a different browser (Chrome/Firefox recommended)

### Canvas Appears Stretched

**Problem:** Visualization looks distorted.

**Solution:** The canvas maintains 16:9 ratio - resize your browser window and it will recalculate. If using custom CSS, ensure you're not overriding the canvas dimensions.

### Accumulative Modes Too Messy

**Problem:** Architect/Paint modes get too crowded.

**Solutions:**
- Press Stop to reset the canvas
- Reduce intensity slider
- Switch to a different visualization mode temporarily

---

## 📚 Learning Resources

### Understanding p5.js
- [p5.js Official Tutorial](https://p5js.org/learn/)
- [p5.sound Library Reference](https://p5js.org/reference/#/libraries/p5.sound)
- [Coding Train - p5.js Sound Tutorial](https://thecodingtrain.com/tracks/sound)

### Audio Visualization Concepts
- [FFT Explained](https://betterexplained.com/articles/an-interactive-guide-to-the-fourier-transform/)
- [Understanding Audio Frequency Ranges](https://www.headphonesty.com/2020/02/audio-frequency-spectrum-explained/)

### Web Audio API
- [MDN Web Audio API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## 📄 License

This project is open-source and available for educational purposes. Feel free to modify and extend it for your own learning.

---

## 🙏 Acknowledgments

- **p5.js**: Created by Lauren McCarthy and the Processing Foundation
- **Fonts**: Inter by Rasmus Andersson, Space Grotesk by Florian Karsten
- **Inspiration**: Bauhaus design movement, generative art community

---

