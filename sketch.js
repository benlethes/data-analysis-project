// Global Audio Variables
let sound;
let fft;
let amplitude;
let audioContextStarted = false;

// Visualization Variables
let vizStyle = 'waveform';
let intensity = 1.0;
let colorPalette = 'bauhaus';

// --- Palette Definitions ---
const palettes = {
    'bauhaus': [[109, 53, 138], [246, 217, 18], [252, 132, 5], [0, 0, 255], [200, 20, 20]],
    'neon': [[255, 0, 255], [0, 255, 255], [255, 255, 0], [50, 0, 100], [0, 255, 0]],
    'monochrome': [[0, 0, 0], [50, 50, 50], [100, 100, 100], [200, 200, 200], [20, 20, 20]],
    'pastel': [[255, 183, 178], [181, 234, 215], [226, 240, 203], [255, 218, 193], [224, 187, 228]]
};

function setup() {
    let container = select('#canvas-container');
    
    // 16:9 Cinematic Calculation
    let w = container.width;
    let h = w * 9/16;
    
    // Constrain to available height
    if (h > container.height) {
        h = container.height;
        w = h * 16/9;
    }

    let canvas = createCanvas(w, h);
    canvas.parent('canvas-container');
    
    // Initialize Audio Analyzers
    fft = new p5.FFT(0.8, 1024);
    amplitude = new p5.Amplitude();
    
    // Ensure master volume is up
    outputVolume(1.0);
    
    setupControls();
    
    background(255);
    
    // Check Audio Context status periodically
    setInterval(checkAudioState, 1000);
}

function checkAudioState() {
    // If audio context exists but is suspended, show warning
    if (getAudioContext().state !== 'running') {
        select('#audio-debug').style('display', 'block');
    } else {
        select('#audio-debug').style('display', 'none');
    }
}

function draw() {
    // Handle Analysis
    let bass = 0, mid = 0, treble = 0, vol = 0;
    
    if (sound && sound.isPlaying()) {
        fft.analyze();
        bass = fft.getEnergy("bass");
        mid = fft.getEnergy("mid");
        treble = fft.getEnergy("treble");
        vol = amplitude.getLevel();
        
        // Update Intensity based on slider
        let sliderVal = select('#intensitySlider').value();
        intensity = map(sliderVal, 0, 100, 0.5, 4.0);
    }

    // --- VIZ 1: WAVEFORM (Standard) ---
    if (vizStyle === 'waveform') {
        background(255); 
        drawWaveform(vol);
    } 
    // --- VIZ 2: OPTICAL FLOW ---
    else if (vizStyle === 'optical') {
        background(0); 
        drawOptical(bass, mid);
    }
    // --- VIZ 3: ARCHITECT ---
    else if (vizStyle === 'architect') {
        // Accumulation: Do not clear background
        drawArchitect(treble, vol);
    }
    // --- VIZ 4: PAINT BLEND ---
    else if (vizStyle === 'paint') {
        // Accumulation: Do not clear background
        drawPaint(bass, treble, vol);
    }
}

// ==============================================
// 1. WAVEFORM (Standard)
// ==============================================
function drawWaveform(vol) {
    let wave = fft.waveform();
    noFill();
    stroke(0);
    strokeWeight(1.5 * intensity);
    
    beginShape();
    for (let i = 0; i < width; i++) {
        let index = floor(map(i, 0, width, 0, wave.length));
        let x = i;
        let y = map(wave[index], -1, 1, height, 0);
        vertex(x, y);
    }
    endShape();
    
    stroke(0, 0, 255, 100);
    line(0, height/2, width, height/2);
}

// ==============================================
// 2. OPTICAL FLOW (Moiré/Warped)
// ==============================================
function drawOptical(bass, mid) {
    stroke(255);
    noFill();
    strokeWeight(1.5);
    
    let gap = 20; 
    let curveAmp = map(bass, 0, 255, 0, 150) * intensity; 
    
    // Add Z-axis time movement
    let time = frameCount * 0.05;
    
    for (let y = 0; y < height; y += gap) {
        beginShape();
        for (let x = 0; x < width; x += 20) {
            let distFromCenter = dist(x, y, width/2, height/2);
            
            // Sine waves creating the "fabric" look
            let wave1 = sin(x * 0.02 + time);
            let wave2 = cos(y * 0.03 + time);
            
            // Bass distorts the wave height
            let distortion = wave1 * wave2 * curveAmp;
            
            // Mid frequency adds "glitch" noise
            if (mid > 100) {
                distortion += noise(x, y) * map(mid, 0, 255, 0, 50);
            }
            
            vertex(x, y + distortion);
        }
        endShape();
    }
}

// ==============================================
// 3. ARCHITECT (Shattered Plans)
// ==============================================
function drawArchitect(treble, vol) {
    if (vol < 0.05) return;
    
    stroke(0, 200);
    strokeWeight(1);
    noFill();
    
    // Strobe white on heavy hits
    if (vol > 0.7 && random() > 0.9) {
        fill(255, 100);
        rect(0, 0, width, height);
        noFill();
    }
    
    // Recursive looking lines
    let x = random(width);
    let y = random(height);
    let size = random(50, 400) * intensity;
    
    // Draw "Floor Plan" shards
    beginShape();
    for (let i = 0; i < 5; i++) {
        let xOff = random(-size, size);
        let yOff = random(-size, size);
        
        // Snap to 90 degrees for architect look
        if (random() > 0.5) xOff = 0;
        else yOff = 0;
        
        vertex(x + xOff, y + yOff);
    }
    endShape();
    
    // Connecting construction lines
    if (random() > 0.5) {
        stroke(0, 0, 255, 50); // Blue construction lines
        line(x, 0, x, height);
    }
}

// ==============================================
// 4. PAINT BLEND (Color Schemes)
// ==============================================
function drawPaint(bass, treble, vol) {
    noStroke();
    if (vol < 0.01) return;
    
    let currentPalette = palettes[colorPalette];
    let count = floor(map(vol, 0, 1, 1, 5) * intensity);
    
    for(let i = 0; i < count; i++) {
        let col = random(currentPalette);
        let r = col[0];
        let g = col[1];
        let b = col[2];
        
        let alpha = map(vol, 0, 1, 5, 80);
        fill(r, g, b, alpha);
        
        // Blend mode driven by Treble
        if (treble > 150) blendMode(HARD_LIGHT);
        else blendMode(BLEND);
        
        let w = random(20, 200) * intensity;
        let h = random(20, 400) * intensity;
        let x = random(width);
        let y = random(height);
        
        rect(x, y, w, h);
    }
    blendMode(BLEND);
}

// ==============================================
// UI & AUDIO HANDLING (THE FIX)
// ==============================================
function setupControls() {
    // 1. File Upload
    select('#audioFile').changed(function() {
        let file = this.elt.files[0];
        if (file) {
            select('#fileName').html(file.name);
            if (sound) sound.stop();
            
            sound = loadSound(URL.createObjectURL(file), () => {
                select('#playBtn').removeAttribute('disabled');
                select('#pauseBtn').removeAttribute('disabled');
                select('#stopBtn').removeAttribute('disabled');
                select('#playback-info').html('File Loaded. Press Play.');
            });
        }
    });

    // 2. Transport - ROBUST AUDIO START
    select('#playBtn').mousePressed(() => {
        // A: Resume Audio Context (Critical for Safari)
        if (getAudioContext().state !== 'running') {
            getAudioContext().resume();
        }
        
        // B: Play Sound if loaded
        if (sound && sound.isLoaded()) {
            // Force Volume to Max
            outputVolume(1.0); 
            sound.setVolume(1.0);
            
            sound.play();
            select('#playback-info').html('Playing...');
            
            // Visual confirmation in console
            console.log("Playing. Audio Context State:", getAudioContext().state);
        }
    });
    
    select('#pauseBtn').mousePressed(() => {
        if (sound) {
            sound.pause();
            select('#playback-info').html('Paused');
        }
    });
    
    select('#stopBtn').mousePressed(() => {
        if (sound) sound.stop();
        resetCanvas();
    });

    // 3. Viz Selection
    select('#vizStyle').changed(() => {
        vizStyle = select('#vizStyle').value();
        resetCanvas();
    });

    // 4. Color Selection
    select('#colorScheme').changed(() => {
        colorPalette = select('#colorScheme').value();
    });
}

function resetCanvas() {
    if (vizStyle === 'optical') background(0);
    else background(255);
    select('#playback-info').html(vizStyle.toUpperCase() + ' READY');
}

function windowResized() {
    let container = select('#canvas-container');
    let w = container.width;
    let h = w * 9/16;
    if (h > container.height) {
        h = container.height;
        w = h * 16/9;
    }
    resizeCanvas(w, h);
    resetCanvas();
}