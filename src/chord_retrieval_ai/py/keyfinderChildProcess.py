import sys
import json
import librosa
from keyfinder import Tonal_Fragment
import pyloudnorm as pyln
import numpy as np
import matplotlib
import soundfile


def clip(number, min, max):
    if number < min:
        return min
    elif number > max:
        return max
    else:
        return number

if len(sys.argv) > 1:
    try:
        audio_path = sys.argv[1]
        animation_appended = sys.argv[2]
    
        y, sr = librosa.load(audio_path)
        duration = librosa.get_duration(y=y, sr=sr) # Duration of the split .aac file (from Phase "Splitting Audio from Video") !Not length of appended animation!
        animation_start = None
        if (animation_appended):
            animation_start = duration + 0.97
        else:
            animation_start = float(sys.argv[3])


        # if animation_appended == "true":
        #     analysis_start = librosa.time_to_samples(clip(duration - 1, 0, duration), sr=sr) # 1.4s from SL start till end 
        #     analysis_end = librosa.time_to_samples(duration, sr=sr)
        # else: #Calculate with logo detection time!!!
        analysis_start_secs = clip(animation_start - 3.25, 0, duration) # Soundlogo start (animation_start - 3.55)
        analysis_end_secs = clip(analysis_start_secs+1.25, 0, duration)
        analysis_start = librosa.time_to_samples(analysis_start_secs, sr=sr)
        analysis_end = librosa.time_to_samples(analysis_end_secs, sr=sr)


        

        y_harmony_segment = y[analysis_start:analysis_end]
        y_loudness_segment =  y[librosa.time_to_samples(0, sr=sr):analysis_end]

        # Ensure y_segment is not empty
        if len(y_harmony_segment) == 0:
            raise ValueError("The audio segment is empty")

        # Integrated Loudness Analysis
        meter = pyln.Meter(sr)  # create BS.1770 meter
        integrated_loudness = meter.integrated_loudness(y_loudness_segment)  # measure loudness
        segment_loudness = meter.integrated_loudness(y_harmony_segment)
        overall_loudness = (meter.integrated_loudness(y))

        analysisSegmentEmpty = False
        audioEmpty = False
        key_analysis = {"likely_key": None, "correlation": None}

        if np.isnan(overall_loudness) or np.isinf(overall_loudness):
            analysisSegmentEmpty = True
            audioEmpty = True
            integrated_loudness = None
            segment_loudness = None
        elif np.isnan(integrated_loudness) or np.isinf(integrated_loudness):
            analysisSegmentEmpty = True
            integrated_loudness = None
            segment_loudness = None
            
        elif np.isnan(segment_loudness) or np.isinf(segment_loudness):
            analysisSegmentEmpty = True
            segment_loudness = None
        else:
            y_harmonic, y_percussive = librosa.effects.hpss(y_harmony_segment)
            key_analysis = Tonal_Fragment(y_harmonic, sr).get_key_info()


        analysis = {
            "analyzed_audio": audio_path,
            "audioEmpty": audioEmpty,
            "analysis": key_analysis,
            "loudness": integrated_loudness,
            "segmentLoudness": segment_loudness,
            "analysisSegmentEmpty": analysisSegmentEmpty
                            }

        print(json.dumps(analysis))
        sys.stdout.flush()

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.stderr.flush()

else:
    print("Please provide a song name as an argument.")



    
