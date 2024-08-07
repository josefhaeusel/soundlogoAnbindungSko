import os
from computer_vision import ComputerVision 

script_dir = os.path.dirname(os.path.realpath(__file__))
videos = ["klaus.mp4"]
videoPath= f"{script_dir}/test/{videos[0]}"

# logo_time = ComputerVision(videoPath).matchVideoFrames(showVideoPlayer = False)
# print("Logo Time",logo_time)


results = []
for i in range(len(videos)):
    videoPath= f"{script_dir}/test/{videos[i]}"
    result = ComputerVision(videoPath).matchVideoFrames(showVideoPlayer = True)
    results.append(result)
    print(results[len(results)-1], "\n")




