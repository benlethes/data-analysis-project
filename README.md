# Data Analysis Project: Sound Visualization (Enhanced)

An interactive web-based audio visualization tool that transforms sound into dynamic visual art. Upload audio files, use demo tracks, or connect your microphone to experience real-time visualizations through seven distinct modes.

## 🆕 What's New in This Version

### New Features
- ✅ **Demo Files**: Two built-in demo tracks (Classical & Electronic)
- ✅ **Microphone Input**: Real-time visualization of live audio
- ✅ **Fixed Play Bug**: No more issues when clicking play multiple times
- ✅ **Dynamic Slider**: Intensity changes affect visuals without resetting the canvas
- ✅ **Fullscreen Mode**: Immersive full-screen viewing
- ✅ **Mobile Support**: Touch-friendly controls and responsive design
- ✅ **3 New Visualizations**: Grid Mosaic, Lissajous Curves, Diagonal Weave
- ✅ **4 New Color Palettes**: Sunset, Ocean, Earth, Midnight (8 total palettes)
- ✅ **Universal Color Schemes**: All palettes now affect every visualization mode

### Coming Soon
- 🔄 **MIDI Input**: See guide below for implementation

---

## 📖 Quick Start Guide

### Option 1: Use Demo Files
1. Open `index.html` in a web browser
2. Click **"Classical"** or **"Electronic"** demo button
3. Press **Play** and watch the visualization

### Option 2: Upload Your Own Audio
1. Click **"Select Audio File"**
2. Choose any audio file (MP3, WAV, OGG, etc.)
3. Press **Play**

### Option 3: Use Microphone
1. Click **"🎤 Microphone"** button
2. Allow microphone access when prompted
3. Start making sounds or play music near your mic

---

## 🎨 Visualization Modes

### A. Waveform (Classic)
Classic oscilloscope showing the raw audio waveform.
- **Best for**: Seeing beats, vocals, and song structure
- **Audio mapping**: Direct amplitude → vertical position

### B. Optical Flow (3D)
Flowing fabric-like patterns with depth illusion.
- **Best for**: Electronic music, ambient soundscapes
- **Audio mapping**: 
  - Bass → Wave distortion
  - Mid → Glitch effects
  - Time → 3D movement

### C. Architect (Structure)
Accumulating geometric blueprints and construction lines.
- **Best for**: Building suspense, progressive tracks
- **Audio mapping**:
  - Volume → Generation rate
  - Treble → Line brightness
  - High volume → White flash strobe

### D. Color Blend (Paint)
Abstract painting with overlapping colored rectangles.
- **Best for**: Colorful, energetic music
- **Audio mapping**:
  - Volume → Shape count
  - Treble → Blend mode (hard light vs normal)

### E. Grid Mosaic (Tiles) *NEW*
Dynamic color grid that responds to all frequencies.
- **Best for**: Complex music with many layers
- **Audio mapping**:
  - Bass → Grid density (X-axis)
  - Mid → Grid density (Y-axis)
  - Treble → Color hue shift
  - Volume → Brightness

### F. Lissajous (Curves) *NEW*
Mathematical curves creating harmonograph-style patterns.
- **Best for**: Harmonic music, sustained notes
- **Audio mapping**:
  - Bass → Point count (complexity)
  - Mid → X-axis frequency
  - Treble → Y-axis frequency

### G. Diagonal Weave (Lines) *NEW*
Cross-hatched line patterns with variable thickness.
- **Best for**: Rhythmic music, beats
- **Audio mapping**:
  - Bass → Diagonal line thickness
  - Treble → Opposite diagonal thickness

---

## 🎨 Color Palettes

All palettes now work with **every visualization mode**:

- **Bauhaus**: Bold primary colors (purple, yellow, orange, blue, red)
- **Cyber**: Vibrant neons (magenta, cyan, yellow, green) on dark
- **Carbon**: Monochrome blacks and greys
- **Ether**: Soft pastels (pink, mint, cream)
- **Sunset** *NEW*: Warm oranges, reds, and purples
- **Ocean** *NEW*: Cool blues and cyans
- **Earth** *NEW*: Natural browns and tans
- **Midnight** *NEW*: Deep purples and blues on dark

---

## 🎮 Controls Explained

### 01. Input Source
- **Select Audio File**: Upload from your computer
- **Classical/Electronic**: Load demo tracks
- **Microphone**: Use live audio input

### 02. Transport
- **Play**: Start playback (only works for audio files, not mic)
- **Pause**: Pause at current position
- **Reset**: Stop and clear the canvas

### 03. Visualization
Choose from 7 different visual styles

### 04. Color Palette
Choose from 8 color schemes

### 05. Reactivity
- **Left (Subtle)**: Gentle, understated movements
- **Middle (50)**: Balanced response (default)
- **Right (Extreme)**: Aggressive, dramatic reactions

### Fullscreen Button
Click "⛶ Fullscreen" in the top-right to enter full-screen mode

---

## 📱 Mobile Usage

The app is fully mobile-compatible:

1. **Touch Support**: Tap anywhere to activate audio (required by browsers)
2. **Responsive Layout**: Controls stack vertically on small screens
3. **Microphone**: Works great on mobile devices
4. **Fullscreen**: Tap the fullscreen button for immersive viewing

**Note**: Some browsers may require HTTPS for microphone access on mobile.

---

## 🎹 MIDI Input Implementation Guide

While this version doesn't include MIDI, here's how you can add it:

### What You'll Need
- A MIDI controller (keyboard, pad controller, etc.)
- USB or Bluetooth connection to your computer
- Chrome, Edge, or Opera browser (Web MIDI API support)

### Implementation Steps

#### 1. Add MIDI Button to HTML
In `index.html`, add after the microphone button:

```html
<button id="midiBtn" style="margin-top: 5px;">🎹 MIDI Input</button>
<div id="midiStatus" style="font-size: 0.6rem; margin-top: 3px;">MIDI: Not Connected</div>
```

#### 2. Add MIDI Variables to sketch.js
At the top of the file:

```javascript
let midiAccess;
let midiNotes = []; // Array to store currently playing notes
let isMidiMode = false;
```

#### 3. Add MIDI Setup Function

```javascript
function setupMIDI() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess()
            .then(onMIDISuccess, onMIDIFailure);
    } else {
        select('#midiStatus').html('MIDI: Not Supported');
        console.log('Web MIDI API not supported');
    }
}

function onMIDISuccess(access) {
    midiAccess = access;
    const inputs = midiAccess.inputs.values();
    
    for (let input of inputs) {
        input.onmidimessage = handleMIDIMessage;
        console.log('MIDI Input:', input.name);
    }
    
    if (midiAccess.inputs.size > 0) {
        select('#midiStatus').html('MIDI: Connected');
        isMidiMode = true;
    } else {
        select('#midiStatus').html('MIDI: No Devices');
    }
}

function onMIDIFailure() {
    select('#midiStatus').html('MIDI: Access Denied');
    console.log('Could not access MIDI devices');
}

function handleMIDIMessage(message) {
    const [command, note, velocity] = message.data;
    
    // Note On: command = 144
    if (command === 144 && velocity > 0) {
        midiNotes.push({note: note, velocity: velocity});
        console.log('Note ON:', note, 'Velocity:', velocity);
    }
    
    // Note Off: command = 128 or velocity = 0
    if (command === 128 || (command === 144 && velocity === 0)) {
        midiNotes = midiNotes.filter(n => n.note !== note);
        console.log('Note OFF:', note);
    }
}
```

#### 4. Create MIDI Visualization

```javascript
function drawMIDIVisualization() {
    background(0, 20); // Fade effect
    
    // Draw each active note
    for (let i = 0; i < midiNotes.length; i++) {
        let noteData = midiNotes[i];
        let note = noteData.note;
        let velocity = noteData.velocity;
        
        // Map MIDI note (0-127) to positions
        let x = map(note, 0, 127, 0, width);
        let size = map(velocity, 0, 127, 10, 200) * intensity;
        
        // Choose color based on note
        let hue = map(note, 0, 127, 0, 360);
        colorMode(HSB);
        fill(hue, 80, 90, 0.7);
        noStroke();
        
        ellipse(x, height/2, size, size);
        colorMode(RGB);
    }
}
```

#### 5. Call MIDI Setup in setup()

```javascript
function setup() {
    // ... existing setup code ...
    
    setupMIDI(); // Add this line
}
```

#### 6. Add MIDI Button Handler

```javascript
select('#midiBtn').mousePressed(() => {
    if (!isMidiMode) {
        setupMIDI();
    }
});
```

#### 7. Update draw() Function

```javascript
function draw() {
    // ... existing audio analysis ...
    
    // Add MIDI mode check
    if (isMidiMode && midiNotes.length > 0) {
        drawMIDIVisualization();
    } else {
        // ... existing visualization routing ...
    }
}
```

### MIDI Usage Tips
- **Note Numbers**: Middle C = 60, higher notes = higher numbers
- **Velocity**: How hard you hit the key (0-127)
- **Visual Mapping Ideas**:
  - Note pitch → Horizontal position or color
  - Velocity → Size or opacity
  - Number of notes → Shape count
  - Note range → Different visualizations

### Troubleshooting MIDI
- **Not working?** Check browser compatibility (Chrome is best)
- **No devices found?** Ensure MIDI controller is connected before opening the page
- **Access denied?** Check browser permissions for MIDI

---

## 🛠️ Technical Documentation

### File Structure
```
project/
├── index.html          # Main HTML with UI
├── sketch.js           # p5.js visualization logic
├── demo1_classical.mp3 # Demo file 1
├── demo2_electronic.mp3# Demo file 2
└── README.md          # This file
```

### Technologies Used
- **p5.js** (v1.7.0): Creative coding framework
- **p5.sound**: Audio analysis library
- **Web Audio API**: Microphone input
- **Fullscreen API**: Full-screen mode
- **CSS Grid**: Responsive layout

### Browser Compatibility
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ⚠️ Safari (may need user interaction for audio)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Audio Analysis Details

**FFT (Fast Fourier Transform)**
- 1024 frequency bins
- 0.8 smoothing factor (prevents jitter)
- Frequency ranges:
  - Bass: 20-140 Hz
  - Mid: 140-2600 Hz
  - Treble: 2600-20000 Hz

**Amplitude**
- RMS (Root Mean Square) level
- Range: 0.0 (silence) to 1.0 (maximum)

---

## 🐛 Troubleshooting

### Audio Won't Play
1. Click the Play button (user interaction required)
2. Check if "AUDIO CONTEXT SUSPENDED" warning appears
3. Try refreshing the page
4. Ensure file format is supported (MP3, WAV, OGG)

### Microphone Not Working
1. Grant microphone permission when prompted
2. Check browser console for errors
3. Ensure microphone is not in use by another app
4. Try HTTPS (some browsers require secure connection)

### Visualizations Not Responding
1. Wait for "File Loaded" or "Recording..." message
2. Check intensity slider (try moving to 75-100%)
3. Ensure audio has actual sound content (not silence)
4. Try a different visualization mode

### Mobile Issues
1. Tap the screen once to activate audio context
2. Disable Low Power Mode on iOS
3. Use headphones for better performance
4. Close other apps to free up memory

---

## 🎓 For Beginners: How This Works

### The Basics

**HTML (index.html)**
- Defines the structure: buttons, sliders, canvas
- Like building with LEGO blocks - each element has a purpose

**JavaScript (sketch.js)**
- The "brain" that makes everything work
- Tells the computer what to do when you click buttons
- Analyzes the music and creates visuals

**p5.js Library**
- A tool that makes creative coding easier
- Handles drawing, colors, and sound analysis

### Key Concepts

**Audio Analysis**
Think of music as having 3 main parts:
- **Bass**: Low rumbles (kick drums)
- **Mid**: Middle tones (vocals, guitars)
- **Treble**: High sounds (cymbals, hi-hats)

The program "listens" to these and uses the information to control:
- Colors (what hues to use)
- Positions (where to draw)
- Sizes (how big shapes are)
- Movement (how fast things change)

**The Draw Loop**
The `draw()` function runs 60 times per second (60 FPS), like a flipbook:
1. Analyze the current audio
2. Calculate what to draw
3. Draw shapes/lines/colors
4. Repeat

**Intensity Slider**
Multiplies all visual reactions:
- Low setting: Visual = AudioLevel × 0.5
- High setting: Visual = AudioLevel × 4.0

### Learning Path

If you want to understand and modify this project:

1. **Start with p5.js basics**: https://p5js.org/learn/
2. **Learn about variables**: The `let` statements store information
3. **Understand functions**: Blocks of code that do specific tasks
4. **Play with numbers**: Try changing values and see what happens!

**Safe things to experiment with:**
- Change numbers in color arrays (RGB values: 0-255)
- Modify `intensity` multipliers
- Adjust strokeWeight values
- Change shape sizes

**Example experiment:**
In `drawWaveform()`, change:
```javascript
strokeWeight(1.5 * intensity);
```
to:
```javascript
strokeWeight(3 * intensity); // Makes the waveform thicker!
```

---

## 📚 Resources for Learning

### JavaScript Basics
- [JavaScript.info](https://javascript.info/) - Comprehensive tutorial
- [Codecademy JavaScript](https://www.codecademy.com/learn/introduction-to-javascript) - Interactive

### p5.js
- [p5.js Tutorial](https://p5js.org/learn/) - Official guide
- [The Coding Train](https://thecodingtrain.com/) - Fun video tutorials
- [p5.js Reference](https://p5js.org/reference/) - All functions explained

### Audio Visualization
- [FFT Explained](https://betterexplained.com/articles/an-interactive-guide-to-the-fourier-transform/)
- [Audio Frequency Guide](https://www.headphonesty.com/2020/02/audio-frequency-spectrum-explained/)

---

## 🎯 Next Steps / Ideas for Enhancement

### Easy Modifications
- Add more color palettes (copy existing palette structure)
- Create new visualization by copying existing function
- Adjust frequency ranges for different music styles

### Medium Difficulty
- Add audio recording/export functionality
- Create preset combinations (visualization + palette + intensity)
- Add keyboard shortcuts for controls

### Advanced Features
- MIDI input (see guide above)
- WebGL 3D visualizations
- Audio effects (reverb, delay)
- Export animation as video
- Multi-track visualization (analyze multiple files)

---

## 📄 License

This project is open-source and available for educational purposes.

---

## 🙏 Acknowledgments

- **p5.js**: Lauren McCarthy and Processing Foundation
- **Fonts**: Inter (Rasmus Andersson), Space Grotesk (Florian Karsten)
- **Inspiration**: Bauhaus, generative art community

---

**Happy Visualizing! 🎨🎵**
