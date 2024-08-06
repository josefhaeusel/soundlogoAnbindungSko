import os
import numpy as np
import cv2

class ComputerVision:
    def __init__(self, videoPath):
        script_dir = os.path.dirname(os.path.realpath(__file__))
        self.templatePath = f'{script_dir}/template.png'
        self.template = cv2.imread(self.templatePath, 0)
        self.videoPath = videoPath
        self.video = cv2.VideoCapture(self.videoPath)
        self.fps, self.total_frames, self.duration_secs, self.frame_width, self.frame_height = self.getVideoProperties()
        self.threshold = 0.85

        self.secSearchSkip = 0.1
        self.frameSearchSkip = 10 
        self.analysisStartBeforeEnd = 6
        self.analysisAbortBeforeEnd = 0.5
        
        self.setVideoBeforeEnd()
        self.method = cv2.TM_CCOEFF_NORMED
        self.detection_scales = np.linspace(0.4, 1.0, 7)[::-1]
        self.isUHD = self.checkUHDResize()

        self.logo_scale = None
        self.logo_scale_id = None
        self.detected_time = None

    def checkUHDResize(self):
        if (self.frame_width + self.frame_height) == 6000 or (self.frame_width + self.frame_height) == 4320:
            self.detection_scales *= 2
            return True
        else:
            return False

    def getCurrentTime(self):
        currentFrame = self.video.get(cv2.CAP_PROP_POS_FRAMES)
        currentTime = currentFrame / self.fps
        return currentTime

    def getVideoProperties(self):
        fps = self.video.get(cv2.CAP_PROP_FPS)
        total_frames = int(self.video.get(cv2.CAP_PROP_FRAME_COUNT))
        duration_secs = total_frames / fps
        frame_width = int(self.video.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(self.video.get(cv2.CAP_PROP_FRAME_HEIGHT))
        return fps, total_frames, duration_secs, frame_width, frame_height

    def setVideoBeforeEnd(self):
        start_time = self.duration_secs - self.analysisStartBeforeEnd
        if start_time<0:
            start_time=0
        start_frame = int(start_time * self.fps)
        self.video.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

    def setVideoBeforeEnd(self):
        start_time = self.duration_secs - self.analysisStartBeforeEnd
        start_frame = int(start_time * self.fps)
        self.video.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

    def matchTemplateMultiScale(self, frame):
        found = None
        h, w = self.template.shape[:2]

        for scale_id, scale in enumerate(self.detection_scales):
            resized_template = cv2.resize(self.template, (int(w * scale), int(h * scale)))
            result = cv2.matchTemplate(frame, resized_template, self.method)
            min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
            if found is None or max_val > found[0]:
                found = (max_val, max_loc, scale, scale_id)

        return found

    def scaleDropout(self):
        UHDScaleFactor = 1
        if (self.isUHD):
            UHDScaleFactor=2
            
        self.detection_scales = np.linspace((self.logo_scale-(0.1*UHDScaleFactor)), (self.logo_scale+(0.1*UHDScaleFactor)), 3)[::-1]
        self.detection_scales = self.detection_scales[self.detection_scales<=1.0*UHDScaleFactor]
        
    def matchVideoFrames(self, showVideoPlayer=False):
        isDetecting = True

        while isDetecting:
            try:

                current_frame = self.video.get(cv2.CAP_PROP_POS_FRAMES)
                next_frame = current_frame + self.frameSearchSkip
                self.video.set(cv2.CAP_PROP_POS_FRAMES, next_frame)
                ret, frame = self.video.retrieve()

                if not ret:
                    break
                frame2 = cv2.cvtColor(frame.copy(), cv2.COLOR_BGR2GRAY)
                found = self.matchTemplateMultiScale(frame2)

                # Dropout Condition
                if (self.duration_secs - self.getCurrentTime()) < self.analysisAbortBeforeEnd:
                    isDetecting = False

                if found:
                    detection_value, location, self.logo_scale, self.logo_scale_id = found
                    match_found = detection_value >= self.threshold

                    if showVideoPlayer:
                        print("Logo Detection Accuracy", detection_value)

                    if match_found:
                        self.video.set(cv2.CAP_PROP_POS_FRAMES, next_frame - self.frameSearchSkip)
                        self.scaleDropout()

                        for i in range(self.frameSearchSkip + 1):
                            ret, frame = self.video.read()
                            if not ret:
                                break
                            frame2 = cv2.cvtColor(frame.copy(), cv2.COLOR_BGR2GRAY)

                            found = self.matchTemplateMultiScale(frame2)
                            if found:
                                detection_value, location, self.logo_scale, self.logo_scale_id = found

                                match_found = detection_value >= self.threshold


                                if showVideoPlayer:
                                    print("Logo Detection Accuracy", detection_value)

                                if match_found:
                                    self.detected_time = self.getCurrentTime()
                                    if showVideoPlayer:
                                        h, w = self.template.shape[:2]
                                        top_left = location
                                        bottom_right = (int(top_left[0] + w * self.logo_scale), int(top_left[1] + h * self.logo_scale))
                                        cv2.rectangle(frame, top_left, bottom_right, 255, 5)
                                        message = f"Logo Frame Matched. Accuracy: {detection_value * 100:.2f}%"
                                        cv2.putText(frame, message, (top_left[0], bottom_right[1] + 50), cv2.FONT_HERSHEY_DUPLEX, 0.7, (255, 0, 0))
                                    else:
                                        isDetecting = False
                                    break

                    if showVideoPlayer:
                        cv2.imshow('Video', frame)
                        if match_found:
                            cv2.waitKey(200)

                        if cv2.waitKey(1) == ord('q'):
                            isDetecting = False

            except Exception as e:
                isDetecting = False

        self.video.release()
        cv2.destroyAllWindows()

        if self.detected_time is not None:
            response = {"logo_start": self.detected_time,
                        "logo_scale": self.logo_scale,
                        "positionBeforeEnd": self.duration_secs - self.detected_time,
                        "videoResolution": [self.frame_width, self.frame_height],
                        }
            return response
        else:
            response = {"logo_start": "None",
                        "videoResolution": [self.frame_width, self.frame_height]
                        }
            return response
