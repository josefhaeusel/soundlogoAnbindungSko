import sys, json
from computer_vision import ComputerVision

if len(sys.argv) > 1:
    video_path = sys.argv[1]  # The first argument is the script name, so the song name is the second argument

    analysis = ComputerVision(video_path).matchVideoFrames()
    if analysis["logo_start"] == "None":
        appendAnimation = True
    else:
        appendAnimation = False

    response = {
        "analyzed_video": video_path,
        "analysis": analysis,
        "appendAnimation": appendAnimation,
    }
    
    print(json.dumps(response))

    sys.stdout.flush()

else:
    
    print("Please provide the video path as an argument.")
