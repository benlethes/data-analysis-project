// ===== GLOBAL VARIABLES =====
// These are accessible throughout the entire file
let sound;              // The audio file we load
let fft;                // Fast Fourier Transform analyzer (for frequencies)
let amplitude;          // Amplitude analyzer (for volume level)
let audioBuffer;        // Raw audio data (array of numbers)
let vizType = 'waveform';  // Current visualization type
let spectrogramData = [];  // Store frequency history for spectrogram

// ===== SETUP FUNCTION =====
// This runs ONCE when the page loads
function setup() {
    // Create a canvas 800 pixels wide, 400 pixels tall
    let canvas = createCanvas(800, 400);
    
    // Put the canvas inside the canvas-container div
    canvas.parent('canvas-container');
    
    // Create analyzers for audio analysis
    fft = new p5.FFT(0.8, 1024);
    // 0.8 = smoothing (0-1, higher = smoother)
    // 1024 = number of frequency bins to analyze
    
    amplitude = new p5.Amplitude();
    
    // === SET UP FILE INPUT ===
    let fileInput = select('#audioFile');
    fileInput.changed(handleFile);  // When file is selected, call handleFile()
    
    // === SET UP BUTTONS ===
    select('#playBtn').mousePressed(playAudio);
    select('#pauseBtn').mousePressed(pauseAudio);
    select('#stopBtn').mousePressed(stopAudio);
    
    // === SET UP VISUALIZATION SELECTOR ===
    select('#vizType').changed(changeVizType);
    
    // Set initial background
    background(20);
}

// ===== DRAW FUNCTION =====
// This runs repeatedly (60 times per second by default)
function draw() {
    // Clear the screen with dark gray
    background(20);
    
    // Only draw if audio is loaded
    if (sound && sound.isLoaded()) {
        // Call the appropriate visualization function based on selection
        if (vizType === 'waveform') {
            drawWaveform();
        } else if (vizType === 'spectrum') {
            drawSpectrum();
        } else if (vizType === 'circular') {
            drawCircularSpectrum();
        } else if (vizType === 'spectrogram') {
            drawSpectrogram();
        }
        
        // Show playback information
        showInfo();
    } else {
        // If no audio loaded, show instructions
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(20);
        text('Upload an audio file to begin', width/2, height/2);
    }
}

// ===== FILE HANDLING =====
function handleFile() {
    // Get the file that was uploaded
    let file = this.elt.files[0];
    
    if (file) {
        // Stop any currently playing audio
        if (sound) {
            sound.stop();
        }
        
        // Show filename
        select('#filename').html('Loading: ' + file.name);
        
        // Load the audio file
        sound = loadSound(file, 
            // Success callback - runs when file is loaded
            () => {
                console.log('Audio loaded successfully!');
                select('#filename').html('📄 ' + file.name);
                
                // Disconnect from default output (we'll connect to analyzers)
                sound.disconnect();
                
                // Connect to our analyzers
                sound.connect(fft);
                sound.connect(amplitude);
                
                // Get raw audio data (left channel)
                audioBuffer = sound.buffer.getChannelData(0);
                
                // Enable control buttons
                select('#playBtn').removeAttribute('disabled');
                select('#pauseBtn').removeAttribute('disabled');
                select('#stopBtn').removeAttribute('disabled');
            },
            // Error callback - runs if loading fails
            (err) => {
                console.error('Error loading audio:', err);
                select('#filename').html('❌ Error loading file');
            }
        );
    }
}

// ===== BUTTON HANDLERS =====
function playAudio() {
    if (sound && sound.isLoaded()) {
        sound.play();
    }
}

function pauseAudio() {
    if (sound && sound.isLoaded()) {
        sound.pause();
    }
}

function stopAudio() {
    if (sound && sound.isLoaded()) {
        sound.stop();
        spectrogramData = [];  // Clear spectrogram history
    }
}

function changeVizType() {
    let selector = select('#vizType');
    vizType = selector.value();
    spectrogramData = [];  // Clear spectrogram when changing visualizations
}

// ===== VISUALIZATION 1: WAVEFORM =====
// Shows amplitude over time (the entire audio file)
function drawWaveform() {
    if (!audioBuffer) return;  // Exit if no data
    
    stroke(100, 200, 255);  // Light blue color
    strokeWeight(2);
    noFill();  // Don't fill the shape
    
    beginShape();  // Start drawing a connected line
    
    // audioBuffer has millions of samples, we can only draw 'width' pixels
    // So we skip samples: step = how many samples per pixel
    let step = floor(audioBuffer.length / width);
    
    for (let i = 0; i < width; i++) {
        // Calculate which sample to read
        let index = floor(i * step);
        
        // Get amplitude value (between -1 and 1)
        let amp = audioBuffer[index];
        
        // Map amplitude to y position on screen
        // -1 maps to bottom (height), 1 maps to top (0)
        let y = map(amp, -1, 1, height, 0);
        
        // Add this point to our shape
        vertex(i, y);
    }
    
    endShape();  // Finish the shape
    
    // Draw center line
    stroke(100, 100, 100);
    strokeWeight(1);
    line(0, height/2, width, height/2);
}

// ===== VISUALIZATION 2: FREQUENCY SPECTRUM =====
// Shows current frequency content as vertical bars
function drawSpectrum() {
    // Get current frequency data (returns array of 1024 values, each 0-255)
    let spectrum = fft.analyze();
    
    noStroke();
    
    // We'll only draw the first 256 bars (lower frequencies are more interesting)
    let numBars = 256;
    let barWidth = width / numBars;
    
    for (let i = 0; i < numBars; i++) {
        // Get amplitude for this frequency band
        let amp = spectrum[i];
        
        // Map amplitude to bar height
        let barHeight = map(amp, 0, 255, 0, height);
        
        // Color bars based on frequency (low=red, high=blue)
        colorMode(HSB);  // Use Hue-Saturation-Brightness color mode
        let hue = map(i, 0, numBars, 0, 360);
        fill(hue, 80, 100);
        
        // Draw bar from bottom up
        rect(i * barWidth, height - barHeight, barWidth, barHeight);
    }
    
    colorMode(RGB);  // Switch back to Red-Green-Blue mode
}

// ===== VISUALIZATION 3: CIRCULAR SPECTRUM =====
// Arranges frequency bars in a circle
function drawCircularSpectrum() {
    let spectrum = fft.analyze();
    
    // Move origin to center of canvas
    push();  // Save current drawing settings
    translate(width/2, height/2);
    
    noFill();
    
    let numBars = 180;  // Number of bars around the circle
    let radius = 100;   // Inner radius of the circle
    
    for (let i = 0; i < numBars; i++) {
        // Calculate angle for this bar (in radians)
        let angle = map(i, 0, numBars, 0, TWO_PI);
        // TWO_PI = 2π = 360 degrees
        
        // Get amplitude for this frequency
        let amp = spectrum[i];
        let barHeight = map(amp, 0, 255, 0, 150);
        
        // Calculate start point (inner circle)
        let x1 = cos(angle) * radius;
        let y1 = sin(angle) * radius;
        
        // Calculate end point (outer circle)
        let x2 = cos(angle) * (radius + barHeight);
        let y2 = sin(angle) * (radius + barHeight);
        
        // Color based on amplitude
        stroke(255, map(amp, 0, 255, 50, 255), 200);
        strokeWeight(2);
        
        // Draw the line (bar)
        line(x1, y1, x2, y2);
    }
    
    pop();  // Restore drawing settings
}

// ===== VISUALIZATION 4: SPECTROGRAM =====
// Shows frequency content over time (scrolling heat map)
function drawSpectrogram() {
    let spectrum = fft.analyze();
    
    // Add current spectrum to history
    spectrogramData.push(spectrum);
    
    // Keep only the most recent data (one per pixel width)
    if (spectrogramData.length > width) {
        spectrogramData.shift();  // Remove oldest entry
    }
    
    noStroke();
    
    // Calculate dimensions
    let sliceWidth = width / spectrogramData.length;
    let numBands = 256;  // How many frequency bands to show
    let bandHeight = height / numBands;
    
    // Draw each time slice
    for (let x = 0; x < spectrogramData.length; x++) {
        let spec = spectrogramData[x];
        
        // Draw each frequency band in this slice
        for (let y = 0; y < numBands; y++) {
            let amp = spec[y];
            
            // Color based on amplitude
            colorMode(HSB);
            let brightness = map(amp, 0, 255, 0, 100);
            let hue = map(amp, 0, 255, 240, 0);  // Blue to red
            fill(hue, 80, brightness);
            
            // Draw rectangle for this frequency/time point
            // Note: we flip Y so low frequencies are at bottom
            rect(x * sliceWidth, 
                 height - (y * bandHeight), 
                 sliceWidth, 
                 bandHeight);
        }
    }
    
    colorMode(RGB);
}

// ===== SHOW INFO =====
// Display playback information on screen
function showInfo() {
    fill(255);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(14);
    
    // Show play/pause status and time
    if (sound.isPlaying()) {
        let pos = sound.currentTime();
        let dur = sound.duration();
        text(`▶️ Playing: ${pos.toFixed(1)}s / ${dur.toFixed(1)}s`, 10, 10);
    } else {
        text('⏸️ Paused', 10, 10);
    }
    
    // Show current volume level
    let level = amplitude.getLevel();
    text(`🔊 Level: ${(level * 100).toFixed(1)}%`, 10, 30);
}