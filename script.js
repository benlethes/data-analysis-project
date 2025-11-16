// Global variables (accessible throughout the file)
let audioFile;          // Will hold our audio file
let fft;                // Fast Fourier Transform analyzer
let amplitude;          // Amplitude analyzer
let sound;              // The loaded sound object
let audioBuffer;        // Raw audio data for static visualizations
let vizType = 'waveform';  // Current visualization type

// setup() runs once when the program starts (like __init__ in Python classes)
function setup() {
    // Create a canvas 800x400 pixels
    createCanvas(800, 400);
    
    // Create analyzers
    fft = new p5.FFT(0.8, 1024);  // (smoothing, bins)
    // smoothing: 0-1, how much to smooth data (0.8 = pretty smooth)
    // bins: number of frequency bands to analyze (1024 is good default)
    
    amplitude = new p5.Amplitude();
    
    // Set up file input
    let fileInput = select('#audioFile');  // select() is like document.getElementById
    fileInput.changed(handleFile);  // When file changes, call handleFile
    
    // Set up buttons
    select('#playBtn').mousePressed(() => {
        if (sound && sound.isLoaded()) {
            sound.play();
        }
    });
    
    select('#pauseBtn').mousePressed(() => {
        if (sound) {
            sound.pause();
        }
    });
    
    select('#stopBtn').mousePressed(() => {
        if (sound) {
            sound.stop();
        }
    });
    
    // Visualization type selector
    select('#vizType').changed((e) => {
        vizType = e.target.value;
    });
    
    background(20);
}

// draw() runs repeatedly (like a while True loop in Python)
// Default: 60 times per second (60 FPS)
function draw() {
    background(20);  // Clear screen with dark gray
    
    // Only draw if we have audio loaded
    if (sound && sound.isLoaded()) {
        // Call the appropriate visualization function
        if (vizType === 'waveform') {
            drawWaveform();
        } else if (vizType === 'spectrum') {
            drawSpectrum();
        } else if (vizType === 'circular') {
            drawCircularSpectrum();
        } else if (vizType === 'spectrogram') {
            drawSpectrogram();
        }
    } else {
        // Show instructions if no audio loaded
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(20);
        text('Upload an audio file to begin', width/2, height/2);
    }
}

// Function to handle file upload
function handleFile() {
    let file = this.elt.files[0];  // Get the uploaded file
    // this.elt gets the actual HTML element
    // files[0] gets the first file (user can only upload one)
    
    if (file) {
        // If there's already audio playing, stop it
        if (sound) {
            sound.stop();
        }
        
        // Load the audio file
        // loadSound is asynchronous (like async/await in Python)
        sound = loadSound(file, () => {
            console.log('Audio loaded!');
            sound.disconnect();  // Disconnect from master output initially
            
            // Connect to our analyzers
            sound.connect(fft);
            sound.connect(amplitude);
            
            // Get the raw audio buffer for static visualizations
            audioBuffer = sound.buffer.getChannelData(0);  // Get left channel
            // This is a Float32Array - like a numpy array of floats
        });
    }
}

// VISUALIZATION 1: Static Waveform
// Shows the entire audio file's amplitude over time
function drawWaveform() {
    if (!audioBuffer) return;
    
    stroke(100, 200, 255);  // Light blue color (R, G, B)
    noFill();  // Don't fill shapes
    
    beginShape();  // Start drawing a connected line
    
    // audioBuffer has millions of samples, we can't draw them all
    // So we'll downsample: take every Nth sample
    let step = floor(audioBuffer.length / width);
    // floor() rounds down (like math.floor in Python)
    // This calculates how many samples to skip
    
    for (let i = 0; i < width; i++) {
        // Map sample index to buffer position
        let index = floor(i * step);
        
        // Get amplitude value (-1 to 1)
        let amp = audioBuffer[index];
        
        // Map amplitude to y position
        // map(value, fromMin, fromMax, toMin, toMax)
        // This is like scaling: -1 becomes height, 1 becomes 0
        let y = map(amp, -1, 1, height, 0);
        
        vertex(i, y);  // Add point to shape
    }
    
    endShape();  // Finish drawing the line
    
    // Draw center line
    stroke(100);
    line(0, height/2, width, height/2);
}