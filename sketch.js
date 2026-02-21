// ── Audio ──────────────────────────────────────────────────────
let sound;
let mic;
let fft;
let amplitude;
let inputMode = 'upload';
let micActive = false;       // own flag — mic.enabled unreliable in Safari

// ── Visualization ──────────────────────────────────────────────
let vizStyle     = 'waveform';
let intensity    = 1.0;
let colorPalette = 'bauhaus';
let vizPaused    = false;
let darkBg       = false;    // false = white bg, true = black bg

// ── Feature toggles ────────────────────────────────────────────
let spectrogramShowAxes = true;
let rimShowLegend       = true;

// ── Spectrogram ────────────────────────────────────────────────
let spectrogramBuffer;
let spectrogramReady = false;

// ── Palettes ───────────────────────────────────────────────────
const palettes = {
    'bauhaus':    [[109, 53, 138], [246, 217, 18], [252, 132, 5],  [0, 0, 255],   [200, 20, 20]],
    'neon':       [[255, 0, 255],  [0, 255, 255],  [255, 255, 0],  [50, 0, 100],  [0, 255, 0]],
    'monochrome': [[0, 0, 0],      [50, 50, 50],   [100, 100, 100],[200, 200, 200],[20, 20, 20]],
    'pastel':     [[255, 183, 178],[181, 234, 215], [226, 240, 203],[255, 218, 193],[224, 187, 228]],
    'sunset':     [[255, 94, 77],  [255, 166, 0],  [251, 197, 49], [255, 69, 105],[138, 43, 226]],
    'ocean':      [[0, 119, 182],  [0, 180, 216],  [72, 202, 228], [0, 150, 199], [144, 224, 239]],
    'earth':      [[101, 84, 50],  [176, 137, 104],[205, 179, 139],[139, 119, 85],[160, 82, 45]],
    'midnight':   [[25, 25, 112],  [72, 61, 139],  [106, 90, 205],[123, 104, 238],[147, 112, 219]]
};

// ── Rimington Color Organ ──────────────────────────────────────
const RIMINGTON_COLORS = [
    [170,  10,  50],  // C  – deep crimson
    [210,  25,  25],  // C# – rich red
    [235,  80,   5],  // D  – red-orange
    [255, 140,   0],  // D# – orange
    [255, 200,  10],  // E  – amber
    [210, 230,  10],  // F  – yellow
    [120, 200,  10],  // F# – yellow-green
    [  0, 165,  60],  // G  – green
    [  0, 170, 150],  // G# – teal
    [  0, 140, 210],  // A  – turquoise
    [ 60,  70, 200],  // A# – blue-violet
    [130,   0, 190],  // B  – purple
];
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

let rimShapes    = [];
let rimNote      = -1;
let rimFreq      = 0;
let rimEnergyAvg = 0;
let rimLastBeat  = 0;

// ── Background helpers ─────────────────────────────────────────
function bgVal() { return darkBg ? 0   : 255; }
function fgVal() { return darkBg ? 255 : 0;   }

// ══════════════════════════════════════════════════════════════
// SETUP
// ══════════════════════════════════════════════════════════════
function setup() {
    let container = select('#canvas-container');
    let w = container.elt.clientWidth;
    let h = w * 9 / 16;
    if (h > container.elt.clientHeight) {
        h = container.elt.clientHeight;
        w = h * 16 / 9;
    }
    let canvas = createCanvas(w, h);
    canvas.parent('canvas-container');

    spectrogramBuffer = createGraphics(w, h);
    spectrogramBuffer.background(bgVal());
    spectrogramReady  = true;

    mic       = new p5.AudioIn();
    fft       = new p5.FFT(0.8, 2048);
    amplitude = new p5.Amplitude();

    outputVolume(1.0);
    setupControls();
    background(bgVal());
    setInterval(checkAudioState, 1000);

    // If the mobile audio overlay was already tapped before p5 finished
    // setting up (audioContextUnlocked flag set in HTML script), resume here.
    if (window.audioContextUnlocked) {
        try { userStartAudio(); } catch(e) {}
        try { getAudioContext().resume(); } catch(e) {}
    }
}

function checkAudioState() {
    if (getAudioContext().state !== 'running') {
        select('#audio-debug').style('display', 'block');
        getAudioContext().resume();
    } else {
        select('#audio-debug').style('display', 'none');
    }
}

// ══════════════════════════════════════════════════════════════
// DRAW
// ══════════════════════════════════════════════════════════════
function draw() {
    let bass = 0, mid = 0, treble = 0, vol = 0;
    let isAnalyzing = false;

    if (inputMode === 'mic') {
        if (micActive) isAnalyzing = true;
    } else {
        if (sound && sound.isPlaying()) isAnalyzing = true;
    }

    if (isAnalyzing) {
        fft.analyze();
        bass      = fft.getEnergy('bass');
        mid       = fft.getEnergy('mid');
        treble    = fft.getEnergy('treble');
        vol       = amplitude.getLevel();
        intensity = map(select('#intensitySlider').value(), 0, 100, 0.5, 4.0);
    }

    let spectrum = fft.analyze();

    if      (vizStyle === 'waveform')    { drawWaveform(); }
    else if (vizStyle === 'optical')     { drawOptical(bass, mid, isAnalyzing); }
    else if (vizStyle === 'architect')   { drawArchitect(treble, vol); }
    else if (vizStyle === 'paint')       { drawPaint(bass, treble, vol); }
    else if (vizStyle === 'spectrogram') { drawSpectrogram(spectrum, isAnalyzing); }
    else if (vizStyle === 'rimington')   { drawRimington(spectrum, isAnalyzing); }
}

// ══════════════════════════════════════════════════════════════
// PALETTE HELPER
// ══════════════════════════════════════════════════════════════
function getPaletteColor(index) {
    let p = palettes[colorPalette];
    let c = p[index % p.length];
    return color(c[0], c[1], c[2]);
}

// ══════════════════════════════════════════════════════════════
// A. WAVEFORM
// ══════════════════════════════════════════════════════════════
function drawWaveform() {
    background(bgVal());
    let wave = fft.waveform();
    noFill();
    stroke(getPaletteColor(3));
    strokeWeight(1.5 * intensity);
    beginShape();
    for (let i = 0; i < width; i++) {
        let idx = floor(map(i, 0, width, 0, wave.length));
        vertex(i, map(wave[idx], -1, 1, height, 0));
    }
    endShape();
    stroke(getPaletteColor(0));
    strokeWeight(0.5);
    line(0, height / 2, width, height / 2);
}

// ══════════════════════════════════════════════════════════════
// B. OPTICAL FLOW
// Rows reach full canvas width; each row cycles through palette.
// Fades toward chosen background colour.
// ══════════════════════════════════════════════════════════════
function drawOptical(bass, mid, isAnalyzing) {
    let bg = bgVal();
    fill(bg, bg, bg, 15);
    noStroke();
    rect(0, 0, width, height);

    if (!isAnalyzing) return;

    let p        = palettes[colorPalette];
    let curveAmp = map(bass, 0, 255, 0, 150) * intensity;
    let time     = frameCount * 0.05;
    let rowIdx   = 0;

    noFill();
    strokeWeight(1.5);

    for (let y = 0; y <= height; y += 20) {
        let c = p[rowIdx % p.length];
        stroke(c[0], c[1], c[2]);
        rowIdx++;
        beginShape();
        for (let x = 0; x <= width; x += 20) {
            let xc = min(x, width);
            let d  = sin(xc * 0.02 + time) * cos(y * 0.03 + time) * curveAmp;
            if (mid > 100) d += noise(xc * 0.01, y * 0.01, time * 0.1) * map(mid, 0, 255, 0, 50);
            vertex(xc, y + d);
        }
        endShape();
    }
}

// ══════════════════════════════════════════════════════════════
// C. ARCHITECT
// ══════════════════════════════════════════════════════════════
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
    let x = random(width), y = random(height);
    let sz = random(50, 400) * intensity;
    beginShape();
    for (let i = 0; i < 5; i++) {
        let xOff = random(-sz, sz);
        let yOff = random(-sz, sz);
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

// ══════════════════════════════════════════════════════════════
// D. PAINT
// ══════════════════════════════════════════════════════════════
function drawPaint(bass, treble, vol) {
    noStroke();
    if (vol < 0.01) return;
    let p     = palettes[colorPalette];
    let count = floor(map(vol, 0, 1, 1, 5) * intensity);
    for (let i = 0; i < count; i++) {
        let c = random(p);
        fill(c[0], c[1], c[2], map(vol, 0, 1, 5, 80));
        blendMode(treble > 150 ? HARD_LIGHT : BLEND);
        rect(random(width), random(height),
             random(20, 200) * intensity,
             random(20, 400) * intensity);
    }
    blendMode(BLEND);
}

// ══════════════════════════════════════════════════════════════
// E. SPECTROGRAM
// ══════════════════════════════════════════════════════════════
function drawSpectrogram(spectrum, isAnalyzing) {
    if (!spectrogramReady) return;
    if (spectrogramBuffer.width !== width || spectrogramBuffer.height !== height) {
        spectrogramBuffer.resizeCanvas(width, height);
        spectrogramBuffer.background(bgVal());
    }
    let pg = spectrogramBuffer;
    if (isAnalyzing) {
        pg.copy(pg, 1, 0, pg.width - 1, pg.height, 0, 0, pg.width - 1, pg.height);
        let binCount = floor(spectrum.length / 2);
        let p        = palettes[colorPalette];
        let bgv      = bgVal();
        pg.noStroke();
        for (let i = 0; i < binCount; i++) {
            let amp    = spectrum[i];
            let y      = map(i, 0, binCount, pg.height, 0);
            let stripH = pg.height / binCount + 1;
            let base   = p[constrain(floor(map(i, 0, binCount, 0, p.length)), 0, p.length - 1)];
            let t      = constrain(map(amp, 0, 255, 0, 1) * intensity, 0, 1);
            pg.fill(lerp(bgv, base[0], t), lerp(bgv, base[1], t), lerp(bgv, base[2], t));
            pg.rect(pg.width - 1, y - stripH, 1, stripH + 1);
        }
    }
    image(spectrogramBuffer, 0, 0);
    if (spectrogramShowAxes) drawSpectrogramLabels();
}

function drawSpectrogramLabels() {
    let labels = [
        { hz: 50,    label: '50 Hz'  },
        { hz: 200,   label: '200 Hz' },
        { hz: 500,   label: '500 Hz' },
        { hz: 1000,  label: '1 kHz'  },
        { hz: 2000,  label: '2 kHz'  },
        { hz: 5000,  label: '5 kHz'  },
        { hz: 10000, label: '10 kHz' },
    ];
    let nyquist = 11025;
    let fg      = fgVal();
    let bg      = bgVal();
    textSize(10);
    textFont('monospace');
    for (let lbl of labels) {
        if (lbl.hz > nyquist) continue;
        let y = map(lbl.hz, 0, nyquist, height, 0);
        stroke(fg, fg, fg, 30);
        strokeWeight(0.5);
        line(0, y, width, y);
        noStroke();
        fill(bg, bg, bg, 200);
        rect(4, y - 9, 48, 13, 2);
        fill(fg, fg, fg, 220);
        text(lbl.label, 6, y + 1);
    }
    noStroke();
    fill(fg, fg, fg, 120);
    textSize(9);
    textAlign(RIGHT, BOTTOM);
    text('TIME ->', width - 6, height - 4);
    textAlign(LEFT, BASELINE);
}

// ══════════════════════════════════════════════════════════════
// F. RIMINGTON COLOR ORGAN
//
// KEY FIX: fft.setInput(mic) is called AFTER mic.start() in the
// Play button handler — NOT when the dropdown changes.
// p5.sound requires an active mic stream before routing works.
// Calling it too early causes silent FFT data (canvas stays white).
//
// Beat detection uses FFT energy (bass+mid), NOT amplitude.getLevel().
// amplitude.getLevel() returns 0 for many seconds after mic starts
// on Safari. FFT energy is reliable from the first frame.
//
// Pitch uses Harmonic Product Spectrum: S[k] × S[2k] × S[3k].
// Fundamentals are reinforced; harmonics partially cancel.
// ══════════════════════════════════════════════════════════════
function drawRimington(spectrum, isAnalyzing) {
    // Slow fade toward the background colour
    let bg = bgVal();
    fill(bg, bg, bg, 22);
    noStroke();
    rect(0, 0, width, height);

    rimUpdateShapes();
    if (rimShowLegend) rimDrawLegend();

    if (!isAnalyzing) return;

    // 1. FFT energy — works identically for mic and file playback
    let bassE  = fft.getEnergy('bass');
    let midE   = fft.getEnergy('mid');
    let energy = (bassE + midE) / 510.0;   // 0→1

    // 2. HPS pitch detection
    let specLen  = spectrum.length;          // 1024
    let nyquist  = 22050;
    let startBin = Math.floor(80   / nyquist * specLen);
    let endBin   = Math.min(
        Math.floor(2000 / nyquist * specLen),
        Math.floor(specLen / 3) - 1
    );

    let hpsPeak = 0, hpsBin = startBin;
    for (let i = startBin; i <= endBin; i++) {
        let p = spectrum[i] * spectrum[i * 2] * spectrum[i * 3];
        if (p > hpsPeak) { hpsPeak = p; hpsBin = i; }
    }

    // Parabolic interpolation for sub-bin accuracy
    let iL    = Math.max(hpsBin - 1, 0);
    let iR    = Math.min(hpsBin + 1, endBin);
    let vL    = spectrum[iL]     * spectrum[iL     * 2] * spectrum[iL     * 3];
    let vC    = spectrum[hpsBin] * spectrum[hpsBin * 2] * spectrum[hpsBin * 3];
    let vR    = spectrum[iR]     * spectrum[iR     * 2] * spectrum[iR     * 3];
    let denom = vL - 2 * vC + vR;
    let off   = (denom !== 0) ? 0.5 * (vL - vR) / denom : 0;
    rimFreq   = ((hpsBin + off) / specLen) * nyquist;

    let midi = (rimFreq > 0) ? Math.round(12 * Math.log2(rimFreq / 440) + 69) : 0;
    rimNote  = ((midi % 12) + 12) % 12;

    // 3. Beat: raw energy spike above slow rolling baseline
    rimEnergyAvg = lerp(rimEnergyAvg, energy, 0.04);
    let sens   = map(select('#intensitySlider').value(), 0, 100, 1.7, 1.1);
    let isBeat = energy > rimEnergyAvg * sens &&
                 energy > 0.005 &&
                 frameCount - rimLastBeat > 8;

    if (isBeat) {
        rimLastBeat = frameCount;
        rimSpawnShapes(energy);
    }
}

function rimSpawnShapes(energy) {
    let rgb      = RIMINGTON_COLORS[rimNote < 0 ? 0 : rimNote];
    let sizeBase = map(energy, 0, 1, 30, 240) * intensity;
    let count    = max(1, round(map(intensity, 0.5, 4.0, 1, 5) * constrain(energy * 2, 0.3, 1.0)));
    for (let i = 0; i < count; i++) {
        rimShapes.push({
            x:      random(width),
            y:      random(height),
            size:   sizeBase * random(0.5, 2.0),
            type:   random(['circle', 'ellipse', 'rect', 'ring']),
            r: rgb[0], g: rgb[1], b: rgb[2],
            alpha:  random(160, 240),
            decay:  random(1.0, 2.5),
            dx:     random(-0.6, 0.6),
            dy:     random(-0.6, 0.6),
            grow:   random(0.05, 0.4),
            rot:    random(TWO_PI),
            rotSpd: random(-0.015, 0.015),
        });
    }
}

function rimUpdateShapes() {
    let punchOut = bgVal();
    for (let i = rimShapes.length - 1; i >= 0; i--) {
        let s = rimShapes[i];
        s.x += s.dx; s.y += s.dy;
        s.alpha -= s.decay;
        s.size  += s.grow;
        s.rot   += s.rotSpd;
        if (s.alpha <= 0) { rimShapes.splice(i, 1); continue; }
        push();
        translate(s.x, s.y);
        rotate(s.rot);
        noStroke();
        fill(s.r, s.g, s.b, s.alpha);
        let half = s.size / 2;
        if      (s.type === 'circle')  { ellipse(0, 0, s.size, s.size); }
        else if (s.type === 'ellipse') { ellipse(0, 0, s.size * 1.6, s.size * 0.6); }
        else if (s.type === 'rect')    { rect(-half, -half * 0.5, s.size, s.size * 0.5, 4); }
        else if (s.type === 'ring') {
            ellipse(0, 0, s.size, s.size);
            fill(punchOut, punchOut, punchOut, s.alpha);
            ellipse(0, 0, s.size * 0.5, s.size * 0.5);
        }
        pop();
    }
}

function rimDrawLegend() {
    let sw    = floor(width / 12);
    let sh    = 14;
    let baseY = height - 60;
    noStroke();
    textFont('monospace');
    textAlign(CENTER, TOP);
    for (let i = 0; i < 12; i++) {
        let rgb    = RIMINGTON_COLORS[i];
        let active = (i === rimNote);
        if (active) {
            fill(rgb[0], rgb[1], rgb[2], 40);
            rect(i * sw - 4, baseY - 50, sw + 8, sh + 60, 6);
            fill(rgb[0], rgb[1], rgb[2], 255);
            rect(i * sw, baseY - 30, sw - 2, sh + 30, 3);
            textSize(13);
            fill(rgb[0], rgb[1], rgb[2], 255);
            text(NOTE_NAMES[i], i * sw + sw / 2, baseY - 48);
            textSize(8);
            fill(fgVal(), fgVal(), fgVal(), 180);
            text(Math.round(rimFreq) + 'Hz', i * sw + sw / 2, baseY + sh + 4);
        } else {
            fill(rgb[0], rgb[1], rgb[2], 80);
            rect(i * sw, baseY, sw - 2, sh, 2);
            textSize(8);
            fill(fgVal(), fgVal(), fgVal(), 130);
            text(NOTE_NAMES[i], i * sw + sw / 2, baseY + sh + 2);
        }
    }
    textAlign(LEFT, BASELINE);
}

// ══════════════════════════════════════════════════════════════
// CONTROLS
// ══════════════════════════════════════════════════════════════
function setupControls() {

    select('#audioSource').changed(function () {
        let val = this.value();
        inputMode = val;
        if (sound) sound.stop();
        stopMic();
        forceReset();   // always unpauses + clears canvas

        let playBtn  = select('#playBtn');
        let pauseBtn = select('#pauseBtn');
        let stopBtn  = select('#stopAudioBtn');

        if (val === 'mic') {
            select('#uploadGroup').removeClass('visible');
            select('#fileName').html('Microphone — press Start Mic');
            playBtn.removeAttribute('disabled');
            playBtn.html('Start Mic');
            pauseBtn.removeAttribute('disabled');
            stopBtn.removeAttribute('disabled');
            // NOTE: fft.setInput(mic) called AFTER mic.start() in Play handler
            amplitude.setInput(mic);

        } else if (val === 'upload') {
            select('#uploadGroup').addClass('visible');
            select('#fileName').html('No file selected');
            playBtn.attribute('disabled', '');
            pauseBtn.attribute('disabled', '');
            stopBtn.attribute('disabled', '');
            playBtn.html('Play');
            playBtn.removeAttribute('class');

        } else if (val.startsWith('demo')) {
            select('#uploadGroup').removeClass('visible');
            let f = (val === 'demo1') ? 'demo1_classical.mp3' : 'demo2_electronic.mp3';
            select('#fileName').html('Loading ' + f + '...');
            sound = loadSound(f, () => {
                select('#fileName').html('Ready: ' + f);
                playBtn.removeAttribute('disabled');
                pauseBtn.removeAttribute('disabled');
                stopBtn.removeAttribute('disabled');
                playBtn.html('Play');
                fft.setInput(sound);
                amplitude.setInput(sound);
            });
        }
    });

    select('#audioFile').changed(function () {
        let file = this.elt.files[0];
        if (!file) return;
        select('#fileName').html(file.name);
        if (sound) sound.stop();
        sound = loadSound(URL.createObjectURL(file), () => {
            select('#playBtn').removeAttribute('disabled');
            select('#pauseBtn').removeAttribute('disabled');
            select('#stopAudioBtn').removeAttribute('disabled');
            select('#playback-info').html('File loaded — press Play.');
            fft.setInput(sound);
            amplitude.setInput(sound);
        });
    });

    select('#playBtn').mousePressed(() => {
        // Always attempt to unlock the audio context first — this is the
        // direct user-gesture call that iOS/Android require. It must be
        // synchronous and at the top of the handler.
        userStartAudio();
        getAudioContext().resume();

        if (vizPaused) {
            vizPaused = false;
            loop();
            select('#pauseBtn').html('Pause');
            if (inputMode !== 'mic' && sound && sound.isPaused()) sound.play();
            select('#playback-info').html(inputMode === 'mic' ? 'Listening...' : 'Playing...');
            return;
        }

        if (inputMode === 'mic') {
            select('#playback-info').html('Starting mic...');
            mic.start(() => {
                // CRITICAL: route FFT to mic only after stream is live.
                // Calling fft.setInput(mic) before this causes silent data
                // on Safari/iOS (stream isn't ready yet).
                fft.setInput(mic);
                amplitude.setInput(mic);
                micActive = true;
                select('#playBtn').addClass('active');
                select('#playback-info').html('Listening to mic...');
            });
            // No setTimeout fallback — it runs outside the gesture window
            // and iOS will block it anyway. The callback above is reliable
            // on Chrome, Firefox, and Safari when called from a tap.
            return;
        }

        if (sound && sound.isLoaded()) {
            if (sound.isPlaying()) return;
            outputVolume(1.0);
            sound.setVolume(1.0);
            sound.play();
            select('#playback-info').html('Playing...');
        }
    });

    select('#pauseBtn').mousePressed(() => {
        if (!vizPaused) {
            vizPaused = true;
            noLoop();
            if (inputMode !== 'mic' && sound && sound.isPlaying()) sound.pause();
            select('#pauseBtn').html('Resume');
            select('#playback-info').html('Paused — canvas frozen');
        } else {
            vizPaused = false;
            loop();
            select('#pauseBtn').html('Pause');
            if (inputMode !== 'mic' && sound && sound.isPaused()) sound.play();
            select('#playback-info').html(inputMode === 'mic' ? 'Listening...' : 'Playing...');
        }
    });

    select('#stopAudioBtn').mousePressed(() => {
        // Stop always unpauses so the canvas is live again
        vizPaused = false;
        loop();
        select('#pauseBtn').html('Pause');
        if (inputMode === 'mic') {
            stopMic();
            select('#playBtn').removeClass('active');
            select('#playBtn').html('Start Mic');
            select('#playback-info').html('Mic stopped');
        } else {
            if (sound) { sound.stop(); select('#playback-info').html('Stopped'); }
        }
    });

    select('#resetBtn').mousePressed(() => {
        resetCanvas();
        select('#playback-info').html('Canvas cleared');
    });

    select('#fullscreen-trigger').mousePressed(() => { fullscreen(!fullscreen()); });
    select('#exit-fs-btn').mousePressed(() => { fullscreen(false); });

    select('#vizStyle').changed(() => {
        vizStyle = select('#vizStyle').value();
        forceReset();
        updateConditionalControls();
    });

    select('#colorScheme').changed(() => { colorPalette = select('#colorScheme').value(); });

    select('#bgToggle').changed(function () {
        darkBg = this.elt.checked;
        if (spectrogramReady) spectrogramBuffer.background(bgVal());
        resetCanvas();
    });

    select('#spectrogramAxesToggle').changed(function () {
        spectrogramShowAxes = this.elt.checked;
    });

    select('#legendToggle').changed(function () {
        rimShowLegend = this.elt.checked;
    });
}

// Show/hide controls that only apply to specific visualizations
function updateConditionalControls() {
    let isRim  = vizStyle === 'rimington';
    let isSpec = vizStyle === 'spectrogram';
    select('#colorScheme')[isRim ? 'attribute' : 'removeAttribute']('disabled', '');
    select('#legendToggleGroup').style('display',    isRim  ? 'flex' : 'none');
    select('#spectrogramAxesGroup').style('display', isSpec ? 'flex' : 'none');
}

function stopMic() {
    try { if (mic) mic.stop(); } catch(e) {}
    micActive = false;
}

// ══════════════════════════════════════════════════════════════
// RESET & RESIZE
// ══════════════════════════════════════════════════════════════

// forceReset: used when switching source or viz.
// Always unpauses so the draw loop is guaranteed to be running.
function forceReset() {
    vizPaused = false;
    loop();
    select('#pauseBtn').html('Pause');
    resetCanvas();
}

// resetCanvas: clears pixels and particle state.
// Does NOT touch vizPaused — call forceReset() when you need
// to guarantee the loop is running.
function resetCanvas() {
    clear();
    background(bgVal());
    if (spectrogramReady) spectrogramBuffer.background(bgVal());
    rimShapes    = [];
    rimNote      = -1;
    rimFreq      = 0;
    rimEnergyAvg = 0;
    rimLastBeat  = 0;
}

function windowResized() {
    let isFs      = fullscreen();
    let container = select('#canvas-container');
    let body      = select('body');

    function applyResize() {
        if (isFs) {
            resizeCanvas(windowWidth, windowHeight);
            container.addClass('fullscreen');
            body.addClass('is-fullscreen');
        } else {
            let w = container.elt.clientWidth;
            let h = w * 9 / 16;
            if (h > container.elt.clientHeight) {
                h = container.elt.clientHeight;
                w = h * 16 / 9;
            }
            resizeCanvas(w, h);
        }
        // If paused: canvas was cleared by resizeCanvas but draw loop is off.
        // Call redraw() once to repaint the current frame rather than leaving
        // a blank canvas. Do NOT resetCanvas() — that would wipe rimShapes etc.
        if (vizPaused) {
            redraw();
        } else {
            resetCanvas();
        }
    }

    if (!isFs) {
        container.removeClass('fullscreen');
        body.removeClass('is-fullscreen');
        setTimeout(applyResize, 100);  // wait for browser reflow
    } else {
        applyResize();
    }
}