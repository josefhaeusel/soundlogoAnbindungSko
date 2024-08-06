
//Audio Nodes
let logoPlayer
let logoBuffers
let audioPlayerCrossFade
let video_url
let audioPlayer
let audioBuffer
let envelope
let master

window.app = Vue.createApp({

    data() {
        return {

            currentLayer: "layer1",
            showResultModal: false,
            showKeys:false,
            marker: { element: null, time: null, label: 'Soundlogo', left: null, exists: null},
            showInvalidFormatToast: false,
            showResolutionHint: false,
            showVideoLengthHint: false,
            showFileSizeHint: false,
            showGeneralError: false,
            selectedLanguage: "English",

            maximumFileSize: 100, // MB
            maximumVideoLength: 120, // Seconds

            progressBar: {
                phase: 0,
                phaseValues: [],
                hasBeenActive: [0],
                texts: [],
                percentage: 0,
                timer: null,
                error: false,
                eventSource: true
            },

            playbackPosition: 0,
            sliderValue: 0,
            audioDuration: 0,
            soundlogoPosition: 0,
            videoPlayer: null,

            animationLength: null,
            animationMinimumLength: 1.2, //01:00:01:04 rest length from "T" logo detection

            isLoadingAnalysis: false,
            isLoadingResult: false,
            soundlogoKeys: [
                'X',
                'X',
            ],

            selectedKey: { id: '0', key: 'A' },
            measuredLUFS: 0,
            soundlogoLUFS:-10,
            videoPlayerLUFS:-26.71,
            desiredMasterLUFS: -20,

            actionList: {},

            video_file: null,
            video_url:"",
            video_path:"",
            inputVideoData:{},
            videoAnalysis:{logo_start: null, videoResolution: [null, null]},
            metadataLoadedOnce: false,
            playerHasBeenClicked: false,

            feedback: {thumbs: null, text: "", show: false, thumbsup:{ hover: null }, thumbsdown:{ hover: null }}

        }
    },

    async mounted() {
        await this.setup();
        this.initializeActionList()

        this.videoPlayer = videojs("myVideo");
        console.log("VIDEO PLAYER", this.videoPlayer);
    
        this.videoPlayer.ready(() => {
            console.log("Video player is ready");
            this.videoPlayer.on('playing', this.startPlayback);
            this.videoPlayer.on('pause', this.stopPlayback);
            this.videoPlayer.on('waiting', this.interruptPlayback);
            this.videoPlayer.on('volumechange', this.updateListeningVolume);
        });

        // TODO: 2024-07-11, add csrf use @microsoft/fetch-event-source
        const eventSource = new EventSource('/chord-retrieval-ai/progress');
    
        eventSource.onmessage = async (event) => {
            this.progressBar.eventSource = true;
            const data = JSON.parse(event.data);
            await this.setProgress_API(data.message);
        };
    
        eventSource.onerror = (err) => {
            this.progressBar.eventSource = false;
            console.error('EventSource failed:', err);
            eventSource.close();
        };

        // 2024-07-11, moved event handler from index.html due to csp
        document.addEventListener('DOMContentLoaded', function() {
            const uploadButtons = document.querySelectorAll('.upload-button');
            uploadButtons.forEach(function(button) {
                button.addEventListener('click', function() {
                    document.getElementById('fileInput').click();
                });
            });
        });

        // document.addEventListener('drop', function(event) {
        //     console.log("DROP")
        //     event.preventDefault(); // Prevent default behavior (e.g., opening the file in the browser)
        //     // const files = event.dataTransfer.files; // Get the dropped files
        // });

    },

    methods: {
        initializeActionList(){
            this.actionList = {commonResolution: null, commonRatio: null, commonFiletype:null, commonFileSize: null, commonVideoLength: null, success: null, audioEmpty: null, audioSegmentEmpty: null, convertedVideo: false, keyDetected: null, altKeyDetected:null, logoDetected: null,  appendedAnimation:null,fatalAnimationLength: null}
        },
        formatNumber(value, decimals = 2) {
            return value.toFixed(decimals);
        },
        formatNumberPercentage(value, decimals = 1) {
            let testValue = value.toFixed(decimals).toString()

            if (!testValue.endsWith('.0')){
                return value.toFixed(decimals);}
            else {
                return value.toFixed(decimals)-0.1
            }
        },
        handleErrorReturn(){

            this.isLoadingAnalysis=false;
            this.actionList= { success: false, audioEmpty: null, logoDetected: null, convertedVideo: false, commonResolution: this.actionList.commonResolution, commonRatio: this.actionList.commonRatio, commonFiletype: this.actionList.commonFiletype, fatalAnimationLength: null, commonFileSize: this.actionList.commonFileSize, commonVideoLength:  this.actionList.commonVideoLength}
            console.log("ACTION LIST:", this.actionList)

        },
        async setProgress_API(message){
            console.log("Progress message:", message)
            switch (message) {
                case 'Uploading Video...':
                    this.progressBar.phase = 0
                  break;
                case 'Retrieving Video Data...':
                    this.progressBar.phase = 1
                  break;
                case 'Converting Video Format...':
                    this.progressBar.phase = 2
                  break;
                case 'Splitting Audio from Video...':
                    this.progressBar.phase = 3
                  break;
                case 'Detecting T-Outro Animation...':
                    this.progressBar.phase = 4
                  break;
                case 'Retrieving Key and Loudness...':
                    this.progressBar.phase = 5
                  break;
                case 'Appending T-Outro Animation...':
                    this.progressBar.phase = 6
                  break;
                case 'Loading Video...':
                    this.progressBar.phase = 7
                    break
                case 'Done (on Client-side).':
                    clearInterval(this.progressBar.timer);
                    this.progressBar.phase = 8;
                    this.progressBar.percentage = 101
                    setTimeout(()=>{this.currentLayer = "layer2"; this.isLoadingAnalysis=false}, 1200)
                    break;
              }

            if (this.progressBar.phase != this.progressBar.hasBeenActive[2]){
                this.progressBar.hasBeenActive.push(this.progressBar.phase)
                if (this.progressBar.hasBeenActive.length > 3) {
                    this.progressBar.hasBeenActive.shift()
                }
            }
        },
        initProgressBar(){
            this.progressBar={
                phase: 0,
                phaseValues: [10, 20, 30, 40, 60, 80, 95, 100],
                texts: ['Uploading Video...', 'Retrieving Video Data...', 'Converting Video Format...',"Splitting Audio from Video...","Detecting T-Outro Animation...",  "Retrieving Key and Loudness...", "Appending T-Outro Animation...", "Loading Video...", "Done."],
                hasBeenActive: [0],
                percentage: 0,
                timer: null,
                error: false,
                eventSource: true
            }

            this.progressBar.timer = setInterval(this.updateProgressBar, 100)
        },
        getPhaseStyle(index){
            
            if (index==this.progressBar.phaseValues.length) {
                return 'previous-phase'
            }
            else if (index == this.progressBar.phase) {
                return 'current-phase'
            } else {
                return 'previous-phase'

            }
        },

        updateProgressBar() {
            let percentDifference = this.progressBar.phaseValues[this.progressBar.phase] - this.progressBar.percentage;
        
            this.progressBar.percentage += percentDifference * 0.004; 

            if (this.progressBar.phase != 0){
                this.progressBar.percentage = clamp(this.progressBar.percentage, this.progressBar.phaseValues[this.progressBar.phase-1], this.progressBar.phaseValues[this.progressBar.phase])
            } else {
                this.progressBar.percentage = clamp(this.progressBar.percentage, 0, this.progressBar.phaseValues[this.progressBar.phase])
            }
            
            //If eventSource / SSE connection fails: fake progressBar phases
            if (!this.progressBar.eventSource && this.progressBar.phase != (this.progressBar.phaseValues.length-1) && percentDifference < 5) {
                this.progressBar.phase += 1
            }
        },
        updateLanguage(locale) {
            this.$i18n.locale = locale
            this.selectedLanguage = locale
            console.log(this.selectedLanguage)
        },
        async handleFileUpload(event) {
            this.initializeActionList()
            this.video_file = event.target.files[0]
            console.log(this.video_file)
            this.actionList.commonFiletype = await this.checkFiletype()
            this.actionList.commonFileSize = await this.checkFileSize()
            
            if (this.actionList.commonFiletype && this.actionList.commonFileSize){
                try {
                    this.isLoadingAnalysis = true;
                    await this.setProgress_API('Uploading Video...');
                    this.initProgressBar()
                    const analysis = await uploadVideo_API(this.video_file);
                    if (analysis.error) {
                        throw new Error(analysis.error)
                    }

                    await this.setProgress_API("Loading Video...")
                    await this.createVideoSources(analysis.videoOutputFile);
                    await this.loadVideoPlayer();
                    await this.extractAudioBuffer();
                    await this.setProgress_API('Done (on Client-side).')
                    
                    await this.analysisHandler(analysis);
                    this.setVideoPlayerBeforeLogo();
                    // console.log(this.actionList)

                } catch (error){
                    console.log("Analysis Error:",error)
                    this.handleProgressAnalysisError(error.message)
                }} 
            else {
                this.showInvalidFormatToast = true;
            }

        },
        setVideoPlayerBeforeLogo(){
            let timeBeforeLogo = this.soundlogoPosition-5
            console.log("Set Time before Logo:", timeBeforeLogo)
            if (timeBeforeLogo < 0) {
                timeBeforeLogo = 0
            }
            this.videoPlayer.currentTime(timeBeforeLogo)
        },
        async checkFiletype() {
            console.log("Checking Filetype", this.video_file.type)
            let allowedFiletypes = new Set(["video/mp4", "video/ogg", "video/webm", "video/quicktime"]);
            return allowedFiletypes.has(this.video_file.type);
        },
        async checkFileSize() {
            const sizeMegabyte = this.video_file.size/1000000
            console.log("Checking Filesize", `${sizeMegabyte}MB`)
            return (sizeMegabyte <= this.maximumFileSize)
        },
        handleProgressAnalysisError(error){

            this.showResolutionHint = true
            this.showInvalidFormatToast = true
            console.error(error)
            if (error == 'Invalid Filesize.'){
                this.actionList.commonFileSize = false
            } else if (error == 'Length not supported.'){
                this.actionList.commonVideoLength = false
            } else if (error == 'Resolution and display ratio not supported.'){
                this.actionList.commonResolution = false
                this.actionList.commonRatio = false
            } else if (error == 'Resolution not supported.'){
                this.actionList.commonResolution = false
                this.actionList.commonRatio = true
            } else if (error == 'Display ratio not supported.') {
                this.actionList.commonResolution = true
                this.actionList.commonRatio = false
            } else {
               this.showGeneralError = true
               this.showResolutionHint = false
               this.showInvalidFormatToast = false
            }

            this.isLoadingAnalysis = false
            console.log(this.actionList)

        },
        async analysisHandler(analysis) {

            this.videoAnalysis = analysis.videoAnalysis.analysis;

            //VIDEO DATA
            console.log("Input Video Data:",analysis.videoAnalysis.inputVideoData)
            console.log("Codec:",analysis.videoAnalysis.inputVideoData.codec_name)
            this.inputVideoData = analysis.videoAnalysis.inputVideoData


            this.audioDuration = this.inputVideoData.duration_ms/1000

            //APPENDED ANIMATION PART
            if (analysis.videoAnalysis.appendAnimation == true) {
                console.log("APPENDED ANIMATION")
                this.audioDuration += 3
                this.videoAnalysis.logo_start = this.audioDuration - 1.55 //No Claim Timing -1.02
                this.actionList.appendedAnimation = analysis.videoAnalysis.appendAnimation;
            }

            //T-OUTRO ANALYSIS PART
            if (this.videoAnalysis.logo_start == "None" || analysis.videoAnalysis.appendAnimation == true){
                this.actionList.logoDetected = false;
            } else {
                this.actionList.logoDetected = true;
                this.animationLength = this.audioDuration - this.videoAnalysis.logo_start

                if (this.animationLength < this.animationMinimumLength)
                    {
                        this.actionList.fatalAnimationLength = true
                        console.log(`FATAL ANIMATION LENGTH (${this.animationMinimumLength}):`, this.animationLength)
                    }
            }

            //KEY ANALYSIS PART
            this.actionList.audioSegmentEmpty = analysis.audioAnalysis.analysisSegmentEmpty;
            const likely_key = analysis.audioAnalysis.analysis.likely_key;
            const alt_key = analysis.audioAnalysis.analysis.also_possible;
            const loudness = analysis.audioAnalysis.loudness;

            if (this.actionList.audioSegmentEmpty) {
                await this.setKeys("C major")
                this.measuredLUFS = -20
                console.log(`Audio Empty. Standardized Values: ${this.soundlogoKeys[1]}, ${this.measuredLUFS} LUFS`);
            }
            else if (likely_key.key == null){
                await this.setKeys("C major")
                console.log(`No Key Detected. Standardized Values: ${this.soundlogoKeys[1]}.`);
            } else
            {
                this.actionList.keyDetected=true
                this.measuredLUFS = loudness
                await this.setKeys(likely_key.key)
            }
            if (analysis.audioAnalysis.analysis.also_possible){
                this.actionList.altKeyDetected=true

                const alt_logo_key = logoKeyMap[analysis.audioAnalysis.analysis.also_possible.key]    
                if (this.soundlogoKeys[1] != alt_logo_key){
                    console.log(`Alt Key ${alt_logo_key} has replaced ${this.soundlogoKeys[1]}`)
                    this.soundlogoKeys[1] = alt_logo_key

                    if (likely_key.key.includes(alt_logo_key) && likely_key.key.includes("minor")){
                        this.soundlogoKeys = this.soundlogoKeys.reverse()
                        console.warn(`Keys have been swapped, because of major prioritization over minor of same root.`)
                    }
                }
            }

            //CONVERTED VIDEO PART
            if (analysis.videoAnalysis.convertedVideo == true) {
                this.actionList.convertedVideo = true
            }

            //SIMPLE SUCCESS FEEDBACK
            if (this.actionList.logoDetected && this.actionList.keyDetected || this.actionList.appendedAnimation && this.actionList.keyDetected){
                this.actionList.success = true;
            }


            this.setSoundlogoPosition()
            this.setVideoMarker();
            this.setLoudness();

        },
        async createVideoSources(video_name){

            console.log("Creating Video Sources...")

            const parsedPath = video_name.replaceAll('\\', '/').split("/");
            this.video_path = `./temp_uploads/video/${parsedPath[parsedPath.length-1]}`

            const response = await fetch(this.video_path);
            const blob = await response.blob();

            this.video_file = new File([blob], this.video_path, {
                type: "video/mp4",
            });
            this.video_url = await URL.createObjectURL(this.video_file);
        },   
        checkAnimationLength(){

            if (!this.actionList.fatalAnimationLength){
                this.showResultModal = true
            }  else {
                this.progressBar.error = true
            }
        
        },
        setVideoMarker(){

            let left
            if (this.soundlogoPosition < 0) {
                left = "1%"}
            else {
                left = (this.soundlogoPosition / this.audioDuration * 100) + '%';
                }

            if (this.marker.exists){
                let left = (this.soundlogoPosition / this.audioDuration * 100) + '%';
                this.marker.element.style.left = left
                this.marker.element.setAttribute('data-time', this.soundlogoPosition);


            } else {
                const markerElement = document.createElement('div');



                this.marker =
                    { element: markerElement, time: this.soundlogoPosition, label: 'Soundlogo', left: left, exists:true}

                this.marker.left = left;

                this.marker.element.className = 'vjs-marker';
                this.marker.element.style.left = left;
                this.marker.element.setAttribute('data-time', this.soundlogoPosition);
                this.marker.element.innerHTML = '<span>' + this.marker.label + '</span>';
                this.marker.element.addEventListener('click', () => {
                    this.videoPlayer.setCurrentTime = this.soundlogoPosition;
                });

                const progressControl = this.videoPlayer.controlBar.progressControl.children_[0].el_;
                progressControl.appendChild(this.marker.element);
            }
                
            },

        setSoundlogoPosition(){
            this.soundlogoPosition = this.videoAnalysis.logo_start - 3.55 //Hardcut: 4.25, Besser in Sync: 4.07 // 2.55
        },
        async setKeys(keyName){
            const key = logoKeyMap[keyName];
            const scale = keyToScale(key);
            for (let x = 0; x < this.soundlogoKeys.length; x++) {
                this.soundlogoKeys[x] = scale[x];
            }
            console.log("this.soundlogoKeys",this.soundlogoKeys)
            this.updateLogoKey()
        },
        async updateLogoKey(id='0'){
            this.selectedKey.id = id;
            this.selectedKey.key = this.soundlogoKeys[this.selectedKey.id];
            console.log("Selected Key", this.selectedKey.key);
            logoPlayer = await loadLogoPlayer(Tone.getContext(), this.selectedKey.key, )
            this.setLoudness()

        },
        async loadVideoPlayer() {
            console.log("Loading", this.video_path);
    
            let type = '';
            try {
                if (this.video_file.name.endsWith('.mp4')) {
                    type = 'video/mp4';
                } else if (this.video_file.name.endsWith('.ogv') || this.video_file.name.endsWith('.ogg')) {
                    type = 'video/ogg';
                } else if (this.video_file.name.endsWith('.webm')) {
                    type = 'video/webm';
                } else {
                    throw new Error('Unsupported video format');
                }
    
                const videoUrl = `${this.video_path}?${new Date().getTime()}`; //Unique Videopath
    
                this.videoPlayer.src({
                    type: type,
                    src: videoUrl
                });

                await this.videoPlayer.load();
    
                // Ensure the video is loaded before playing
                this.videoPlayer.on('loadeddata', () => {
                    console.log("Video data loaded");
                    this.videoPlayerLUFS = -26.71;
                    this.setLoudness();
                    this.volumeElement = document.querySelector('.vjs-volume-level');
                    this.volumeElement.style.width = "70%";
                });
        
            } catch (error) {
                console.error("Error loading videoPlayer", error);
            }
        },
        async setLoudness(){

            const soundlogoDb = this.measuredLUFS - this.soundlogoLUFS;
            logoPlayer.set({volume: soundlogoDb})

            masterDb = this.desiredMasterLUFS - this.measuredLUFS;
            listeningDb = this.videoPlayerLUFS - this.measuredLUFS;


            if(this.isLoadingResult){
                master.set({gain: masterDb})
                console.log("MASTER DB", masterDb)
            } 
                else {
                master.set({gain: listeningDb})
                console.log("LISTENING DB", listeningDb)
            }

        },

        async extractAudioBuffer() {

            try {
                audioBuffer = await Tone.ToneAudioBuffer.fromUrl(this.video_url)
                audioPlayer.buffer = audioBuffer

                console.log("Audio buffer loaded:", audioBuffer)

            } catch (error) {
                console.error("Failed to load audio buffer:", error);
            }
        },
        updateListeningVolume(){
            const volume = this.videoPlayer.cache_.lastVolume
            console.log(volume)
            this.videoPlayer.muted(true)
            this.videoPlayerLUFS = scaleValue(volume)
            this.setLoudness()

            if (this.volumeElement) {
                this.volumeElement.style.width = volume*100 + '%';
            }
        },

        startPlayback() {
            // console.log(`Start Playback`)
            this.$nextTick( () =>{
                    this.playbackPosition = this.videoPlayer.currentTime()
                    this.startTransports(this.playbackPosition, this.audioDuration, this.soundlogoPosition)
                    this.playerHasBeenClicked ? '' : this.playerHasBeenClicked=true
                }
            )

        },
        stopPlayback() {
            // console.log(`Stop Playback`)
            this.stopTransports();
        },
        interruptPlayback() {
            // console.log(`Interrupt Playback`)
            this.stopTransports();
        },
        async downloadVideo() {
            try {
                this.stopTransports()
                this.isLoadingResult = true;
                const renderedBuffer = await this.renderAudio();
                const videoFilepath = await uploadRenderedAudio_API(renderedBuffer, this.video_file.name);
                this.isLoadingResult = false;
            } catch (error) {
                console.log("Error during downloadVideo()", error)
                this.isLoadingResult = false;
            }
        },
        async renderAudio() {
            try {
                const renderedBuffer = await Tone.Offline(async ({ transport }) => {
                    await setupAudioNodes(transport.context, this.selectedKey.key);
                    await this.extractAudioBuffer();
                    await this.setLoudness();

                    scheduleAudio(this.audioDuration, 0, this.soundlogoPosition,transport);
                    scheduleLogoSound(this.audioDuration, 0, this.soundlogoPosition, transport);
                    transport.start();
                }, this.audioDuration)
            

                console.log(renderedBuffer)
                // Reinitialize regular Tone.Context
                await setupAudioNodes(Tone.getContext(), this.selectedKey.key);
                this.setLoudness();
                return renderedBuffer }

            catch (error) {
                console.log("Error during renderAudio()", error)
                await setupAudioNodes(Tone.getContext(), this.selectedKey.key);

            }
        },

        startTransports(currentPosition, audioDuration, logoStart) {

            const transport = Tone.Transport
        
            scheduleAudio(audioDuration, currentPosition, logoStart, transport);
            scheduleLogoSound(audioDuration, currentPosition, logoStart, transport);
        
            transport.start();

        },
        stopTransports() {
            Tone.Transport.stop();
            Tone.Transport.cancel()
            audioPlayer.stop();
            logoPlayer.stop();
            this.videoPlayer.pause();
        },
        async setupAudioContextAndNodes(){
            await Tone.start();
            await Tone.context.resume();
            await setupAudioNodes(Tone.getContext());
            this.setLoudness()
        },
        async setup() {
            if (Tone.getContext().state == "running") {
                await this.setupAudioContextAndNodes();
            } else {

                const setupHandler = async () => {
                    await this.setupAudioContextAndNodes();
                    document.body.removeEventListener('click', setupHandler);
                    document.getElementById("fileInputBig").removeEventListener('change', setupHandler);
                    document.getElementById("fileInput").removeEventListener('change', setupHandler);
                };

                document.body.addEventListener('click', setupHandler);
                document.getElementById("fileInputBig").addEventListener('change', setupHandler);
                document.getElementById("fileInput").addEventListener('change', setupHandler);
            }
        },

    }
    
    
})

app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('scale-')
app.use(I18n)
app.mount('#app')





async function setupAudioNodes(context, key='A') {
    try {
        console.log('Setting up audio nodes...');

        master = await loadMasterGain(context);
        console.log('Master gain node initialized:', master);

        envelope = await ampEnvelope();
        console.log('Envelope initialized:', envelope);

        audioPlayer = await loadAudioplayer(context);
        console.log('Audio player initialized:', audioPlayer);

        await loadLogoBuffers();
        logoPlayer = await loadLogoPlayer(context, key);
        console.log('Logo player initialized:', logoPlayer);

        console.log('Audio nodes setup complete.');
    } catch (error) {
        console.error('Error setting up audio nodes:', error);
    }
}



function downloadAudio(buffer, writeName) {
    // Convert the buffer to a WAV Blob
    const wavBlob = convertToWav(buffer);

    // Create an object URL for the Blob
    const url = URL.createObjectURL(wavBlob);

    // Create a download link
    const link = document.createElement('a');
    link.href = url;
    link.download = writeName.split('.').slice(0, -1).join('.');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Simple WAV encoder function
// This is a basic example and might need adjustments based on your specific needs
function convertToWav(buffer) {
    const numChannels = 2;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const subChunk1Size = 16; // for PCM
    const subChunk2Size = numChannels * buffer.length * 2; // 2 bytes per sample
    const chunkSize = 4 + (8 + subChunk1Size) + (8 + subChunk2Size);

    let offset = 0;
    const dataSize = 36 + subChunk2Size;
    const bufferArray = new ArrayBuffer(dataSize);
    const view = new DataView(bufferArray);

    // RIFF header
    writeString(view, offset, 'RIFF'); offset += 4;
    view.setUint32(offset, dataSize - 8, true); offset += 4;
    writeString(view, offset, 'WAVE'); offset += 4;

    // fmt sub-chunk
    writeString(view, offset, 'fmt '); offset += 4;
    view.setUint32(offset, subChunk1Size, true); offset += 4;
    view.setUint16(offset, format, true); offset += 2;
    view.setUint16(offset, numChannels, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * numChannels * 2, true); offset += 4;
    view.setUint16(offset, numChannels * 2, true); offset += 2;
    view.setUint16(offset, 16, true); offset += 2;

    // data sub-chunk
    writeString(view, offset, 'data'); offset += 4;
    view.setUint32(offset, subChunk2Size, true); offset += 4;

    // Write PCM samples
    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
            let sample = buffer.getChannelData(channel)[i] * 0x7FFF;
            if (offset + 2 > dataSize) {
                break; // Prevent writing beyond the buffer size
            }
            view.setInt16(offset, sample, true);
            offset += 2;
        }
    }

    return new Blob([bufferArray], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}


function scheduleAudio(audioDuration, currentPosition, logoStart, transport) {

    const secondsTillEnvStart = calculateEnvScheduleTime(audioDuration, currentPosition, logoStart);

    if (secondsTillEnvStart >= 0) {
        transport.schedule((time) => {
            audioPlayer.start(time, currentPosition);
            envelope.triggerAttack(time);
            console.log("Go Audio!");
        });
        transport.schedule((time) => {
            envelope.triggerRelease(time, time);
            console.log("Go Envelope!");
        }, secondsTillEnvStart);
    }

}

function scheduleLogoSound(audioDuration, currentPosition, logoStart, transport) {

    const secondsTillLogoStart = calculateLogoScheduleTime(audioDuration, currentPosition, logoStart);

    if (secondsTillLogoStart >= 0) {

        transport.schedule((time) => {
            logoPlayer.start(time);
            console.log("Go Logo!");
        }, `+${secondsTillLogoStart}`);

    } else if (secondsTillLogoStart < 0) {
        logoPlayer.start(Tone.immediate(), Math.abs(secondsTillLogoStart));
    }
}

function calculateLogoScheduleTime(audioDuration, currentPosition, logoStart) {
    const secondsTillStart = logoStart - currentPosition;
    return secondsTillStart;
}



async function loadMasterGain(Context) {

    const newMasterGain = new Tone.Gain(0, 'decibels').toDestination();
    newMasterGain.context = Context;

    return newMasterGain

}

async function loadLogoBuffers() {
    logoBuffers = new Tone.ToneAudioBuffers({
        'A': "samples/soundlogos/TLS_A-3.wav",
        'A#': "samples/soundlogos/TLS_A#-3.wav",
        'B': "samples/soundlogos/TLS_B-3.wav",
        'C': "samples/soundlogos/TLS_C-3.wav",
        'C#': "samples/soundlogos/TLS_C#-3.wav",
        'D': "samples/soundlogos/TLS_D-3.wav",
        'D#': "samples/soundlogos/TLS_D#-3.wav",
        'E': "samples/soundlogos/TLS_E-3.wav",
        'F': "samples/soundlogos/TLS_F-3.wav",
        'F#': "samples/soundlogos/TLS_F#-3.wav",
        'G': "samples/soundlogos/TLS_G-3.wav",
        'G#': "samples/soundlogos/TLS_G#-3.wav"
    });
}

async function loadLogoPlayer(Context, key = 'A') {

    const logoBuffer = logoBuffers.get(key);
    const newLogoPlayer = new Tone.Player({ url: logoBuffer, context: Context, volume: 0 });

    newLogoPlayer.connect(master)

    return newLogoPlayer

}

function getVideoDimensions(url) {
    return new Promise((resolve, reject) => {
        // Create a temporary video element
        const video = document.createElement('video');

        // Set the source of the video
        video.src = url;

        // Listen for the loadedmetadata event to get dimensions
        video.addEventListener('loadedmetadata', () => {
            // Resolve the promise with the video's width and height
            resolve({
                width: video.videoWidth,
                height: video.videoHeight
            });

            // Clean up
            video.remove();
        });

        // Handle errors
        video.addEventListener('error', (e) => {
            reject(e);
        });

        // Load the video metadata
        video.load();
    });
}

async function loadAudioplayer(Context) {

    const newAudioPlayer = new Tone.Player({ url: audioBuffer, context: Context, volume: 0 });
    newAudioPlayer.chain(envelope, master);

    return newAudioPlayer

}

function calculateEnvScheduleTime(audioDuration, currentPosition, logoStart) {
    const secondsTillStart = (logoStart+0.4) - currentPosition;
    return secondsTillStart;
}

async function ampEnvelope() {
    const ampEnv = new Tone.AmplitudeEnvelope({
        attack: 0,
        decay: 0,
        sustain: 1.0,
        release: 2

    });

    ampEnv.releaseCurve = "cosine";

    return ampEnv
}

async function updateMainAudioBuffer(filepath) {
    console.log("Updated Main Audio Buffer:", filepath);
    const audioBuffer = new Tone.ToneAudioBuffer(filepath);
    audioPlayer.buffer = audioBuffer;
}

async function uploadRenderedAudio_API(buffer, video_file_name) {
    const name = video_file_name.split('.').slice(0, -1).join('.');
    console.log(name);
    const formData = await audioToWavFile(buffer, name);

    try {
        const response = await fetch('/chord-retrieval-ai/uploadRenderedAudio', {
            method: 'POST',
            body: formData,
            headers: getCsrfHeader(),
        });

        const data = await response.json();
        console.log('Audio uploaded successfully:', data);

        const downloadSuccess = await downloadFile('/download/streamable/?file=' + data.renderedResult, data.renderedResult);

        if (downloadSuccess) {
            console.log('Downloaded successfully:', data);
        } else {
            console.log('Download failed:', data);
        }

    } catch (error) {
        console.error('Error during upload or download:', error);
    }


    function audioToWavFile(buffer, name) {

        const wavBlob = convertToWav(buffer);

        const audioFile = new File([wavBlob], `${name}.wav`, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('file', audioFile);
        return formData
    }

    async function downloadFile(url, filename) {
        try {
            const response = await fetch(url, {
                headers: getCsrfHeader(),
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
    
            const reader = response.body.getReader();
            const contentLength = +response.headers.get('Content-Length');
            let receivedLength = 0; // bytes received
            const chunks = []; // array of received binary chunks
    
            while(true) {
                const {done, value} = await reader.read();
    
                if (done) {
                    break;
                }
    
                chunks.push(value);
                receivedLength += value.length;
    
                //console.log(`Received ${receivedLength} of ${contentLength}`);
            }
    
            const blob = new Blob(chunks);
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl; 
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            
            // Clean up URL object
            URL.revokeObjectURL(downloadUrl);
    
            console.log('File download completed');
            return true;
        } catch (error) {
            console.error('Error downloading file:', error);
            return false;
        }
    }
}


async function uploadVideo_API(file) {

    try {

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/chord-retrieval-ai/uploadVideo', {
            method: 'POST',
            body: formData,
            headers: getCsrfHeader(),
        });

        const data = await response.json();
        console.log("ANALYSIS RESULT", data)

        return data

    }
    catch (error) {
        console.error('Error:', error);

        return {error: error}
    }
}




function keyToScale(key, gender="major") {
    console.log("KEY TO SCALE", key)
    const keyArray = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const keyIndex = keyArray.indexOf(key)


    const scale = [
        key, // Key itself
        // keyArray[(keyIndex + 5) % keyArray.length], // Subdominant
        keyArray[(keyIndex + 7) % keyArray.length], // Dominant
    ];
    console.log("Scale", scale)

    return scale

}

function clamp(num, lower, upper) {
    return Math.min(Math.max(num, lower), upper);
}

function scaleValue(value) {
    const minInput = 0;
    const maxInput = 1;
    const minOutput = -80;
    const maxOutput = -14;

    // Ensure the value is within the input range
    value = Math.min(Math.max(value, minInput), maxInput);

    // Apply exponential scaling
    const expValue = Math.pow(value, 0.6); // Exponent chosen for scaling, can be adjusted

    // Scale to the output range
    const output = minOutput + (maxOutput - minOutput) * expValue;

    return output;
}

const logoKeyMap = {

    'A minor': 'C',
    'A# minor': 'C#',
    'B minor': 'D',
    'C minor': 'D#',
    'C# minor': 'E',
    'D minor': 'F',
    'D# minor': 'F#',
    'E minor': 'G',
    'F minor': 'G#',
    'F# minor': 'A',
    'G minor': 'A#',
    'G# minor': 'B',

    'A major': 'A',
    'A# major': 'A#',
    'B major': 'B',
    'C major': 'C',
    'C# major': 'C#',
    'D major': 'D',
    'D# major': 'D#',
    'E major': 'E',
    'F major': 'F',
    'F# major': 'F#',
    'G major': 'G',
    'G# major': 'G#',

}

function getCsrfHeader() {
    const headers = {};
    if (document.body && document.body.dataset && document.body.dataset.csrfToken) {
        headers['x-csrf-token'] = document.body.dataset.csrfToken;
    }
    return headers;
}


window.supportpalAsyncInit = function () {
    SupportPal.mount({
        "baseURL": "https://team.brand-dialog.telekom.com/de/helpwidget",
        "hash": "NlMmQsFgma",
        "type": "popup",
        "position": "right",
        "colour": "#e20074",
        "buttonIcon": "bubble2",
        "messages": {
            "en": {
                "dock_text": "Feedback"
            }
        },
        "knowledgebase": {
            "enabled": false
        },
        "submitTicket": {
            "enabled": true,
            "departmentId": "15",
            "subject": true
        }
    });
};