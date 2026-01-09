from copy import deepcopy
from ..utils import measure_distance, foot_position
from .homography import Homography

import numpy as np
import cv2


class TacticalViewConverter:
    def __init__(self, court_image_path):
        self.court_image_path = court_image_path
        self.width = 300
        self.height = 161
        self.width_m = 28
        self.height_m = 15

        self.key_points = [
            # Left Edge
            (0, 0),
            (0, int((0.91 / self.height_m) * self.height)),
            (0, int((5.18 / self.height_m) * self.height)),
            (0, int((10 / self.height_m) * self.height)),
            (0, int((14.1 / self.height_m) * self.height)),
            (0, int(self.height)),

            # Middle Line
            (int(self.width / 2), self.height),
            (int(self.width / 2), 0),

            # Left Free Throw Line
            (int((5.79 / self.width_m) * self.width), int((5.18 / self.height_m) * self.height)),
            (int((5.79 / self.width_m) * self.width), int((10 / self.height_m) * self.height)),

            # Right Edge
            (self.width, int(self.height)),
            (self.width, int((14.1 / self.height_m) * self.height)),
            (self.width, int((10 / self.height_m) * self.height)),
            (self.width, int((5.18 / self.height_m) * self.height)),
            (self.width, int((0.91 / self.height_m) * self.height)),
            (self.width, 0),

            # Right Free Throw Line
            (int(((self.width_m - 5.79) / self.width_m) * self.width), int((5.18 / self.height_m) * self.height)),
            (int(((self.width_m - 5.79) / self.width_m) * self.width), int((10 / self.height_m) * self.height)),
        ]

    def validate(self, keypoint_list):
        keypoint_list = deepcopy(keypoint_list)
        for frame_idx, keypoints in enumerate(keypoint_list):
            keypoints = keypoints.xy.tolist()[0]

            detected_indicies = [i for i, kp in enumerate(keypoints) if kp[0] > 0 and kp[1] > 0]

            if len(detected_indicies) < 3:
                continue

            invalid = []

            for i in detected_indicies:
                # Skip Keypoint
                if keypoints[i][0] == 0 and keypoints[i][1] == 0:
                    continue

                other = [idx for idx in detected_indicies if idx != i and idx not in invalid]

                if len(other) < 2:
                    continue

                j, k = other[0], other[1]

                d_ij = measure_distance(keypoints[i], keypoints[j])
                d_ik = measure_distance(keypoints[i], keypoints[k])

                t_ij = measure_distance(self.key_points[i], self.key_points[j])
                t_ik = measure_distance(self.key_points[i], self.key_points[k])

                if t_ij > 0 and t_ik > 0:
                    prop_detected = d_ij / d_ik if d_ik > 0 else float('inf')
                    prop_tactical = t_ij / t_ik if t_ik > 0 else float('inf')

                    error = (prop_detected - prop_tactical) / prop_tactical
                    error = abs(error)

                    if error > 0.8:
                        keypoint_list[frame_idx].xy[0][i] *=0
                        keypoint_list[frame_idx].xyn[0][i] *=0
                        invalid.append(i)


        return keypoint_list

    def map_to_tactic(self, keypoints_list, player_tracks):
        player_positions = []

        for frame_idx, (keypoints, tracks) in enumerate(zip(keypoints_list, player_tracks)):
            positions = {}

            keypoints = keypoints.xy.tolist()[0]

            if keypoints is None or len(keypoints) == 0:
                player_positions.append(positions)
                continue

            detected_keypoints = keypoints

            valid_indicies = [i for i, kp in enumerate(detected_keypoints) if kp[0] > 0 and kp[1] > 0]

            if len(valid_indicies) < 4:
                player_positions.append(positions)
                continue

            source = np.array([detected_keypoints[i] for i in valid_indicies], dtype= np.float32)
            target = np.array([self.key_points[i] for i in valid_indicies], dtype= np.float32)

            try:
                homography = Homography(source, target)

                for player_id, data in tracks.items():
                    bbox =  data["bbox"]
                    player_position = np.array([foot_position(bbox)])

                    position = homography.transform_points(player_position)

                    positions[player_id] = position[0].tolist()

            except (ValueError, cv2.error) as e:
                pass

            player_positions.append(positions)

        return player_positions