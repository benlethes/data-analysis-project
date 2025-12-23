// Global Audio Variables
let sound;
let mic;
let fft;
let amplitude;
let inputMode = 'upload'; // 'upload', 'mic', 'demo'

// Visualization Variables
let vizStyle = 'waveform';
let intensity = 1.0;
let colorPalette = 'bauhaus';

// --- Palette Definitions ---
const palettes = {
    'bauhaus': [[109, 53, 138], [246, 217, 18], [252, 132, 5], [0, 0, 255], [200, 20, 20]],
    'neon': [[255, 0, 255], [0, 255, 255], [255, 255, 0], [50, 0, 100], [0, 255, 0]],
    'monochrome': [[0, 0, 0], [50, 50, 50], [100, 100, 100], [200, 200, 200], [20, 20, 20]],
    'pastel': [[255, 183, 178], [181, 234, 215], [226, 240, 203], [255, 218, 193], [224, 187, 228]],
    'sunset': [[255, 94, 77], [255, 166, 0], [251, 197, 49], [255, 69, 105], [138, 43, 226]],
    'ocean': [[0, 119, 182], [0, 180, 216], [72, 202, 228], [0, 150, 199], [144, 224, 239]],
    'earth': [[101, 84, 50], [176, 137, 104], [205, 179, 139], [139, 119, 85], [160, 82, 45]],
    'midnight': [[25, 25, 112], [72, 61, 139], [106, 90, 205], [123, 104, 238], [147, 112, 219]]
};

function setup() {
    let container = select('#canvas-container');
    
    // 16:9 Cinematic Calculation
    // FIX: Use elt.clientWidth because p5 element .width property can be unreliable for divs
    let w = container.elt.clientWidth; 
    let h = w * 9/16;
    
    // Constrain to available height
    if (h > container.elt.clientHeight) {
        h = container.elt.clientHeight;
        w = h * 16/9;
    }

    let canvas = createCanvas(w, h);
    canvas.parent('canvas-container');
    
    mic = new p5.AudioIn(); 
    fft = new p5.FFT(0.8, 1024);
    amplitude = new p5.Amplitude();
    
    outputVolume(1.0);
    
    setupControls();
    background(255);
    
    setInterval(checkAudioState, 1000);
}

function checkAudioState() {
    if (getAudioContext().state !== 'running') {
        select('#audio-debug').style('display', 'block');
    } else {
        select('#audio-debug').style('display', 'none');
    }
}

function draw() {
    let bass = 0, mid = 0, treble = 0, vol = 0;
    let isAnalyzing = false;

    if (inputMode !== 'mic') {
        if (sound && sound.isPlaying()) isAnalyzing = true;
    } else {
        if (mic.enabled) isAnalyzing = true;
    }

    if (isAnalyzing) {
        fft.analyze();
        bass = fft.getEnergy("bass");
        mid = fft.getEnergy("mid");
        treble = fft.getEnergy("treble");
        vol = amplitude.getLevel();
        
        let sliderVal = select('#intensitySlider').value();
        intensity = map(sliderVal, 0, 100, 0.5, 4.0);
    }

    // VIZ ROUTING
    if (vizStyle === 'waveform') {
        background(255); 
        drawWaveform(vol);
    } 
    else if (vizStyle === 'optical') {
        background(0); 
        drawOptical(bass, mid);
    }
    else if (vizStyle === 'architect') {
        drawArchitect(treble, vol);
    }
    else if (vizStyle === 'paint') {
        drawPaint(bass, treble, vol);
    }
}

// --- Helper for Palettes ---
function getPaletteColor(index) {
    let p = palettes[colorPalette];
    let c = p[index % p.length];
    return color(c[0], c[1], c[2]); 
}

// ==============================================
// VISUALIZATION FUNCTIONS
// ==============================================

function drawWaveform(vol) {
    let wave = fft.waveform();
    noFill();
    let c = getPaletteColor(3); 
    stroke(c);
    strokeWeight(1.5 * intensity);
    
    beginShape();
    for (let i = 0; i < width; i++) {
        let index = floor(map(i, 0, width, 0, wave.length));
        let x = i;
        let y = map(wave[index], -1, 1, height, 0);
        vertex(x, y);
    }
    endShape();
    
    stroke(getPaletteColor(0));
    strokeWeight(0.5);
    line(0, height/2, width, height/2);
}

function drawOptical(bass, mid) {
    let c = getPaletteColor(1);
    stroke(c);
    noFill();
    strokeWeight(1.5);
    
    let gap = 20; 
    let curveAmp = map(bass, 0, 255, 0, 150) * intensity; 
    let time = frameCount * 0.05;
    
    for (let y = 0; y < height; y += gap) {
        beginShape();
        for (let x = 0; x < width; x += 20) {
            let wave1 = sin(x * 0.02 + time);
            let wave2 = cos(y * 0.03 + time);
            let distortion = wave1 * wave2 * curveAmp;
            
            if (mid > 100) {
                distortion += noise(x, y) * map(mid, 0, 255, 0, 50);
            }
            vertex(x, y + distortion);
        }
        endShape();
    }
}

function drawArchitect(treble, vol) {
    if (vol < 0.05) return;
    
    let lineCol = getPaletteColor(0);
    lineCol.setAlpha(200);
    stroke(lineCol);
    strokeWeight(1);
    noFill();
    
    if (vol > 0.7 && random() > 0.9) {
        let flashCol = getPaletteColor(1);
        flashCol.setAlpha(100);
        fill(flashCol);
        rect(0, 0, width, height);
        noFill();
    }
    
    let x = random(width);
    let y = random(height);
    let size = random(50, 400) * intensity;
    
    beginShape();
    for (let i = 0; i < 5; i++) {
        let xOff = random(-size, size);
        let yOff = random(-size, size);
        if (random() > 0.5) xOff = 0; else yOff = 0;
        vertex(x + xOff, y + yOff);
    }
    endShape();
    
    if (random() > 0.5) {
        let accent = getPaletteColor(3);
        accent.setAlpha(50);
        stroke(accent);
        line(x, 0, x, height);
    }
}

function drawPaint(bass, treble, vol) {
    noStroke();
    if (vol < 0.01) return;
    
    let currentPalette = palettes[colorPalette];
    let count = floor(map(vol, 0, 1, 1, 5) * intensity);
    
    for(let i = 0; i < count; i++) {
        let colArr = random(currentPalette);
        let alpha = map(vol, 0, 1, 5, 80);
        fill(colArr[0], colArr[1], colArr[2], alpha);
        
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
// UI & CONTROLS
// ==============================================
function setupControls() {

    // --- Input Source Selector ---
    select('#audioSource').changed(function() {
        let val = this.value();
        inputMode = val;
        
        // Stop everything on change
        if (sound) sound.stop();
        if (mic) mic.stop();
        resetCanvas(); 
        
        let uploadGroup = select('#uploadGroup');
        let fileName = select('#fileName');
        let playBtn = select('#playBtn');
        let pauseBtn = select('#pauseBtn');
        let stopAudioBtn = select('#stopAudioBtn');

        // Setup UI for specific mode
        if (val === 'mic') {
            uploadGroup.removeClass('visible');
            fileName.html('Microphone Input Selected');
            playBtn.removeAttribute('disabled');
            playBtn.html('Start Mic');
            pauseBtn.attribute('disabled', '');
            stopAudioBtn.removeAttribute('disabled');
            
            fft.setInput(mic);
            amplitude.setInput(mic);
        }
        else if (val === 'upload') {
            uploadGroup.addClass('visible');
            fileName.html('No File Selected');
            playBtn.attribute('disabled', '');
            stopAudioBtn.attribute('disabled', '');
            playBtn.html('Play');
            playBtn.removeAttribute('class');
        }
        else if (val.startsWith('demo')) {
            uploadGroup.removeClass('visible');
            let fileToLoad = (val === 'demo1') ? 'demo1_classical.mp3' : 'demo2_electronic.mp3';
            fileName.html('Loading ' + fileToLoad + '...');
            
            sound = loadSound(fileToLoad, () => {
                fileName.html('Ready: ' + fileToLoad);
                playBtn.removeAttribute('disabled');
                stopAudioBtn.removeAttribute('disabled');
                playBtn.html('Play');
                pauseBtn.removeAttribute('disabled');
                
                fft.setInput(sound);
                amplitude.setInput(sound);
            });
        }
    });

    // --- File Upload ---
    select('#audioFile').changed(function() {
        let file = this.elt.files[0];
        if (file) {
            select('#fileName').html(file.name);
            if (sound) sound.stop();
            
            sound = loadSound(URL.createObjectURL(file), () => {
                select('#playBtn').removeAttribute('disabled');
                select('#pauseBtn').removeAttribute('disabled');
                select('#stopAudioBtn').removeAttribute('disabled');
                select('#playback-info').html('File Loaded. Press Play.');
                fft.setInput(sound);
                amplitude.setInput(sound);
            });
        }
    });

    // --- PLAY ---
    select('#playBtn').mousePressed(() => {
        userStartAudio();
        if (inputMode === 'mic') {
            mic.start();
            select('#playBtn').addClass('active');
            select('#playback-info').html('Listening to Mic...');
            return;
        }
        if (sound && sound.isLoaded()) {
            if (sound.isPlaying()) return; // Don't double play
            
            outputVolume(1.0); 
            sound.setVolume(1.0);
            sound.play();
            select('#playback-info').html('Playing...');
        }
    });
    
    // --- PAUSE ---
    select('#pauseBtn').mousePressed(() => {
        if (inputMode === 'mic') return;
        if (sound && sound.isPlaying()) {
            sound.pause();
            select('#playback-info').html('Paused');
        } else if (sound && sound.isPaused()) {
            sound.play();
            select('#playback-info').html('Playing...');
        }
    });
    
    // --- STOP (Music Stop & Rewind) ---
    select('#stopAudioBtn').mousePressed(() => {
        if (inputMode === 'mic') {
            mic.stop();
            select('#playBtn').removeClass('active');
            select('#playBtn').html('Start Mic');
            select('#playback-info').html('Mic Stopped');
        } else {
            if (sound) {
                sound.stop(); // Stops and rewinds to beginning
                select('#playback-info').html('Stopped (Reset to Start)');
            }
        }
    });

    // --- RESET (Clear Canvas ONLY) ---
    select('#resetBtn').mousePressed(() => {
        // Only clear the canvas visually.
        resetCanvas();
        select('#playback-info').html('Canvas Cleared (Audio Playing)');
    });

    // --- FULLSCREEN LOGIC ---
    // 1. Enter Fullscreen
    select('#fullscreen-trigger').mousePressed(() => {
        let fs = fullscreen();
        fullscreen(!fs);
    });

    // 2. Exit Fullscreen (The floating button)
    select('#exit-fs-btn').mousePressed(() => {
        fullscreen(false);
    });

    // --- VIZ & COLOR ---
    select('#vizStyle').changed(() => {
        vizStyle = select('#vizStyle').value();
        resetCanvas();
    });

    select('#colorScheme').changed(() => {
        colorPalette = select('#colorScheme').value();
    });
}

function resetCanvas() {
    clear();
    if (vizStyle === 'optical') background(0);
    else background(255);
}

function windowResized() {
    // Check fullscreen state directly from p5
    let isFs = fullscreen();
    let container = select('#canvas-container');
    let body = select('body');
    
    if (isFs) {
        resizeCanvas(windowWidth, windowHeight);
        container.addClass('fullscreen');
        body.addClass('is-fullscreen'); // Triggers Exit button visibility
    } else {
        // FIX: Use elt.clientWidth here too
        let w = container.elt.clientWidth;
        let h = w * 9/16; // Maintain 16:9
        if (h > container.elt.clientHeight) {
            h = container.elt.clientHeight;
            w = h * 16/9;
        }
        resizeCanvas(w, h);
        container.removeClass('fullscreen');
        body.removeClass('is-fullscreen');
    }
    resetCanvas();
}