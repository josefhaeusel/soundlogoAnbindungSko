import os
from computer_vision import ComputerVision 

script_dir = os.path.dirname(os.path.realpath(__file__))
videos = ["T_outro_claim_standard_1_1_uhd_preview.mp4","T_outro_hard_cut_16_9_hd_preview.mp4", "T_Ending_720_Square.mp4", "Telekom_TeacherEnding_Max.mp4", "EM 2024  Deutsche Telekom.mp4", "Licht an  Gegen Hass im Netz.mp4", "Magenta Blossom Millionen Blumen bringen T zum Blühen.mp4", "ONE MINUTE TO ARRIVE  Tiny habits - Benefits of Mental Well-Being.mp4", "Verbundenheit am Tannenbaum - Frohe Weihnachten.mp4","Video by magentamusik-1.mp4","Whats New Claudia 5G Standalone  Deutsche Telekom.mp4", "Wir Entscheiden Gemeinsam GegenHassimNetz.mp4"]
videoPath= f"{script_dir}/test/{videos[0]}"

# logo_time = ComputerVision(videoPath).matchVideoFrames(showVideoPlayer = False)
# print("Logo Time",logo_time)


results = []
for i in range(len(videos)):
    videoPath= f"{script_dir}/test/{videos[i]}"
    result = ComputerVision(videoPath).matchVideoFrames(showVideoPlayer = False)
    results.append(result)
    print(results[len(results)-1], "\n")




