// ===== GLOBAL VARIABLES =====
let sound;
let fft;
let amplitude;
let audioBuffer;
let vizType = 'waveform';
let spectrogramData = [];

// ===== SETUP FUNCTION =====
function setup() {
    console.log('Setup started...');
    
    // Create canvas
    let canvas = createCanvas(800, 400);
    canvas.parent('canvas-container');
    
    // Create analyzers
    fft = new p5.FFT(0.8, 1024);
    amplitude = new p5.Amplitude();
    
    console.log('Analyzers created');
    
    // Set up file input
    let fileInput = select('#audioFile');
    fileInput.changed(handleFile);
    
    // Set up buttons
    select('#playBtn').mousePressed(playAudio);
    select('#pauseBtn').mousePressed(pauseAudio);
    select('#stopBtn').mousePressed(stopAudio);
    
    // Set up visualization selector
    select('#vizType').changed(changeVizType);
    
    background(20);
    
    console.log('Setup complete!');
}

// ===== DRAW FUNCTION =====
function draw() {
    background(20);
    
    if (sound && sound.isLoaded()) {
        if (vizType === 'waveform') {
            drawWaveform();
        } else if (vizType === 'spectrum') {
            drawSpectrum();
        } else if (vizType === 'circular') {
            drawCircularSpectrum();
        } else if (vizType === 'spectrogram') {
            drawSpectrogram();
        }
        
        showInfo();
    } else {
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(20);
        text('Upload an audio file to begin', width/2, height/2);
    }
}

// ===== FILE HANDLING =====
function handleFile() {
    console.log('handleFile called');
    
    let file = this.elt.files[0];
    console.log('File selected:', file);
    
    if (file) {
        // Check file type
        console.log('File type:', file.type);
        console.log('File size:', file.size, 'bytes');
        
        // Stop any currently playing audio
        if (sound) {
            console.log('Stopping previous sound');
            sound.stop();
        }
        
        // Show loading message
        select('#filename').html('⏳ Loading: ' + file.name);
        
        // IMPORTANT: Create a URL for the file
        let fileURL = URL.createObjectURL(file);
        console.log('File URL created:', fileURL);
        
        // Load the audio file
        console.log('Starting to load sound...');
        sound = loadSound(fileURL, 
            // Success callback
            () => {
                console.log('✅ Audio loaded successfully!');
                console.log('Duration:', sound.duration(), 'seconds');
                
                select('#filename').html('📄 ' + file.name);
                
                // Disconnect from default output
                sound.disconnect();
                
                // Connect to analyzers
                sound.connect(fft);
                sound.connect(amplitude);
                
                // Get raw audio data
                try {
                    audioBuffer = sound.buffer.getChannelData(0);
                    console.log('Audio buffer loaded, length:', audioBuffer.length);
                } catch (err) {
                    console.error('Error getting audio buffer:', err);
                }
                
                // Enable buttons
                select('#playBtn').removeAttribute('disabled');
                select('#pauseBtn').removeAttribute('disabled');
                select('#stopBtn').removeAttribute('disabled');
                
                console.log('Buttons enabled');
            },
            // Error callback
            (err) => {
                console.error('❌ Error loading audio:', err);
                select('#filename').html('❌ Error loading file: ' + err.message);
                alert('Error loading audio file. Please try a different file or format (MP3, WAV, OGG).');
            }
        );
    } else {
        console.log('No file selected');
    }
}

// ===== BUTTON HANDLERS =====
function playAudio() {
    console.log('Play button clicked');
    if (sound && sound.isLoaded()) {
        console.log('Playing sound...');
        sound.play();
    } else {
        console.log('Sound not loaded yet');
    }
}

function pauseAudio() {
    console.log('Pause button clicked');
    if (sound && sound.isLoaded()) {
        sound.pause();
    }
}

function stopAudio() {
    console.log('Stop button clicked');
    if (sound && sound.isLoaded()) {
        sound.stop();
        spectrogramData = [];
    }
}

function changeVizType() {
    let selector = select('#vizType');
    vizType = selector.value();
    console.log('Visualization changed to:', vizType);
    spectrogramData = [];
}

// ===== VISUALIZATION 1: WAVEFORM =====
function drawWaveform() {
    if (!audioBuffer) return;
    
    stroke(100, 200, 255);
    strokeWeight(2);
    noFill();
    
    beginShape();
    
    let step = floor(audioBuffer.length / width);
    
    for (let i = 0; i < width; i++) {
        let index = floor(i * step);
        let amp = audioBuffer[index];
        let y = map(amp, -1, 1, height, 0);
        vertex(i, y);
    }
    
    endShape();
    
    stroke(100, 100, 100);
    strokeWeight(1);
    line(0, height/2, width, height/2);
}

// ===== VISUALIZATION 2: FREQUENCY SPECTRUM =====
function drawSpectrum() {
    let spectrum = fft.analyze();
    
    noStroke();
    
    let numBars = 256;
    let barWidth = width / numBars;
    
    for (let i = 0; i < numBars; i++) {
        let amp = spectrum[i];
        let barHeight = map(amp, 0, 255, 0, height);
        
        colorMode(HSB);
        let hue = map(i, 0, numBars, 0, 360);
        fill(hue, 80, 100);
        
        rect(i * barWidth, height - barHeight, barWidth, barHeight);
    }
    
    colorMode(RGB);
}

// ===== VISUALIZATION 3: CIRCULAR SPECTRUM =====
function drawCircularSpectrum() {
    let spectrum = fft.analyze();
    
    push();
    translate(width/2, height/2);
    
    noFill();
    
    let numBars = 180;
    let radius = 100;
    
    for (let i = 0; i < numBars; i++) {
        let angle = map(i, 0, numBars, 0, TWO_PI);
        let amp = spectrum[i];
        let barHeight = map(amp, 0, 255, 0, 150);
        
        let x1 = cos(angle) * radius;
        let y1 = sin(angle) * radius;
        let x2 = cos(angle) * (radius + barHeight);
        let y2 = sin(angle) * (radius + barHeight);
        
        stroke(255, map(amp, 0, 255, 50, 255), 200);
        strokeWeight(2);
        
        line(x1, y1, x2, y2);
    }
    
    pop();
}

// ===== VISUALIZATION 4: SPECTROGRAM =====
function drawSpectrogram() {
    let spectrum = fft.analyze();
    
    spectrogramData.push(spectrum);
    
    if (spectrogramData.length > width) {
        spectrogramData.shift();
    }
    
    noStroke();
    
    let sliceWidth = width / spectrogramData.length;
    let numBands = 256;
    let bandHeight = height / numBands;
    
    for (let x = 0; x < spectrogramData.length; x++) {
        let spec = spectrogramData[x];
        
        for (let y = 0; y < numBands; y++) {
            let amp = spec[y];
            
            colorMode(HSB);
            let brightness = map(amp, 0, 255, 0, 100);
            let hue = map(amp, 0, 255, 240, 0);
            fill(hue, 80, brightness);
            
            rect(x * sliceWidth, 
                 height - (y * bandHeight), 
                 sliceWidth, 
                 bandHeight);
        }
    }
    
    colorMode(RGB);
}

// ===== SHOW INFO =====
function showInfo() {
    fill(255);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(14);
    
    if (sound.isPlaying()) {
        let pos = sound.currentTime();
        let dur = sound.duration();
        text(`▶️ Playing: ${pos.toFixed(1)}s / ${dur.toFixed(1)}s`, 10, 10);
    } else {
        text('⏸️ Paused', 10, 10);
    }
    
    let level = amplitude.getLevel();
    text(`🔊 Level: ${(level * 100).toFixed(1)}%`, 10, 30);
}

// ===== ERROR HANDLING =====
// This catches errors that might occur
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Error:', message, 'at', source, 'line', lineno);
    return false;
};
```

---

## Now Test It:

1. **Open your browser's Developer Console:**
   - **Chrome/Edge**: Press `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
   - **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
   - **Safari**: `Cmd+Option+C`

2. **Refresh the page** and look at the Console tab

3. **Try uploading an audio file** and watch the console messages

You should see messages like:
```
Setup started...
Analyzers created
Setup complete!
handleFile called
File selected: [File object]
File type: audio/mpeg
Starting to load sound...
✅ Audio loaded successfully!
Duration: 180.5 seconds
Buttons enabled