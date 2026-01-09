import cv2


class TacticalViewDrawer:
    def __init__(self, team_1_color = [255, 245, 238], team_2_color = [128, 0, 0]):
        self.x = 20
        self.y = 40
        self.team_1_color = team_1_color
        self.team_2_color = team_2_color

    def draw(self, frames, court_image_path, width, height, tactical_court_keypoints, tactical_player_positions, player_assignement=None, ball_aquasition=None):
        image = cv2.imread(court_image_path)
        image = cv2.resize(image, (width, height))

        output_frames = []
        for frame_idx, frame in enumerate(frames):
            frame = frame.copy()

            y1 = self.y
            x1 = self.x
            y2 = y1 + height
            x2 = x1 + width

            alpha = 0.6
            overlay = frame[y1:y2, x1:x2].copy()
            cv2.addWeighted(image, alpha, overlay, 1 - alpha, 0, frame[y1:y2, x1:x2])

            for index, keypoint in enumerate(tactical_court_keypoints):
                x, y = keypoint
                x += self.x
                y += self.y
                cv2.circle(frame, (x, y), 3, (128, 128, 128), -1)
                cv2.putText(frame, str(index), (x, y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)

                positions = tactical_player_positions[frame_idx]
                assignment = player_assignement[frame_idx]
                player_with_ball = ball_aquasition[frame_idx]

                for player_id, position in positions.items():
                    team_id = assignment.get(player_id, 1)

                    color = self.team_1_color if team_id==1 else self.team_2_color
                    x, y = int(position[0] + self.x), int(position[1] + self.y)

                    player_radius = 8
                    cv2.circle(frame, (x, y), player_radius, color, -1)

                    if player_id == player_with_ball:
                        cv2.circle(frame, (x, y), player_radius + 3, (0, 0, 255), 2)

            output_frames.append(frame)
        return output_frames