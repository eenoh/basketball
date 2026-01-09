from ultralytics import YOLO
from ..utils import read_stub, save_stub

import supervision as sv
import numpy as np
import pandas as pd


class BallTracker:
    def __init__(self, model_path):
        self.model = YOLO(model_path)

    def detect_frames(self, frames):
        batch_size = 20
        detections = []

        for i in range(0, len(frames), batch_size):
            batch_frames = frames[i:i+batch_size]
            batch_detections = self.model.predict(batch_frames, conf=0.5)
            detections += batch_detections
        return detections

    def get_object_tracks(self, frames, stub=False, stub_path=None):
        tracks = read_stub(stub, stub_path)

        if tracks is not None:
            if len(tracks) == len(frames):
                return tracks

        detections = self.detect_frames(frames)
        tracks = []

        for num, detection in enumerate(detections):
            cls_names = detection.names
            cls_names_inv = {v:k for k,v in cls_names.items()}

            detection_supervision = sv.Detections.from_ultralytics(detection)
            tracks.append({})

            chosen_bbox = None
            max_conf = 0

            for frame_detection in detection_supervision:
                bbox = frame_detection[0].tolist()
                cls_id = frame_detection[3]
                confidence = frame_detection[2]

                if cls_id == cls_names_inv["Ball"]:
                    if max_conf < confidence:
                        chosen_bbox = bbox
                        max_conf = confidence

            if chosen_bbox is not None:
                tracks[num][1] = {"bbox":chosen_bbox}


        save_stub(stub_path, tracks)
        return tracks

    def remove_wrong_detections(self, ball_positions):
        max_distance = 25
        previous_index = -1

        for i in range(len(ball_positions)):
            old_bbox = ball_positions[i].get(1, {}).get('bbox', [])

            if len(old_bbox) == 0:
                continue

            if previous_index == -1:
                previous_index = i
                continue

            new_bbox = ball_positions[previous_index].get(1, {}).get('bbox', [])
            frame_gap = i - previous_index
            ajusted_max_distance = max_distance * frame_gap

            # Calculate distance between previous and new bbox
            if np.linalg.norm(np.array(new_bbox[:2]) - np.array(old_bbox[:2]) ) > ajusted_max_distance:
                ball_positions[i] = {}
            else:
                previous_index = i
        return ball_positions

    def interpolate_ball_positions(self, ball_positions):
        ball_positions = [x.get(1, {}).get('bbox', []) for x in ball_positions]
        dataframe = pd.DataFrame(ball_positions, columns=["x1", "y1", "x2", "y2"])

        # Interpolate missing values
        dataframe = dataframe.interpolate()
        dataframe = dataframe.bfill()

        ball_positions = [{1:{"bbox":x}} for x in dataframe.to_numpy().tolist()]

        return ball_positions

    def get_live_tracks(self, frame):
        results = self.model(frame)
        tracks = {}

        for i, result in enumerate(results):
            for j, box in enumerate(result.boxes.data):
                x1, y1, x2, y2, conf, cls = box[:6]
                tracks[j] = {
                    "bbox": [int(x1), int(y1), int(x2), int(y2)],
                    "id": j,
                    "confidence": float(conf)
                }
        return tracks
