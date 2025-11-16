// Global variables
let sound;
let fft;
let amplitude;
let audioBuffer;
let vizType = 'waveform';
let spectrogramData = [];

function setup() {
    console.log('Setup started...');
    
    let canvas = createCanvas(800, 400);
    canvas.parent('canvas-container');
    
    fft = new p5.FFT(0.8, 1024);
    amplitude = new p5.Amplitude();
    
    console.log('Analyzers created');
    
    let fileInput = select('#audioFile');
    fileInput.changed(handleFile);
    
    select('#playBtn').mousePressed(playAudio);
    select('#pauseBtn').mousePressed(pauseAudio);
    select('#stopBtn').mousePressed(stopAudio);
    select('#vizType').changed(changeVizType);
    
    background(20);
    console.log('Setup complete!');
}

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

function handleFile() {
    console.log('handleFile called');
    let file = this.elt.files[0];
    console.log('File selected:', file);
    
    if (file) {
        console.log('File type:', file.type);
        console.log('File size:', file.size, 'bytes');
        
        if (sound) {
            console.log('Stopping previous sound');
            sound.stop();
        }
        
        select('#filename').html('Loading: ' + file.name);
        
        let fileURL = URL.createObjectURL(file);
        console.log('File URL created:', fileURL);
        
        console.log('Starting to load sound...');
        sound = loadSound(fileURL, 
            function() {
                console.log('Audio loaded successfully!');
                console.log('Duration:', sound.duration(), 'seconds');
                
                select('#filename').html('File: ' + file.name);
                
                sound.disconnect();
                sound.connect(fft);
                sound.connect(amplitude);
                
                try {
                    audioBuffer = sound.buffer.getChannelData(0);
                    console.log('Audio buffer loaded, length:', audioBuffer.length);
                } catch (err) {
                    console.error('Error getting audio buffer:', err);
                }
                
                select('#playBtn').removeAttribute('disabled');
                select('#pauseBtn').removeAttribute('disabled');
                select('#stopBtn').removeAttribute('disabled');
                
                console.log('Buttons enabled');
            },
            function(err) {
                console.error('Error loading audio:', err);
                select('#filename').html('Error loading file');
                alert('Error loading audio file. Please try MP3, WAV, or OGG format.');
            }
        );
    } else {
        console.log('No file selected');
    }
}

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
            
            rect(x * sliceWidth, height - (y * bandHeight), sliceWidth, bandHeight);
        }
    }
    
    colorMode(RGB);
}

function showInfo() {
    fill(255);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(14);
    
    if (sound.isPlaying()) {
        let pos = sound.currentTime();
        let dur = sound.duration();
        text('Playing: ' + pos.toFixed(1) + 's / ' + dur.toFixed(1) + 's', 10, 10);
    } else {
        text('Paused', 10, 10);
    }
    
    let level = amplitude.getLevel();
    text('Level: ' + (level * 100).toFixed(1) + '%', 10, 30);
}