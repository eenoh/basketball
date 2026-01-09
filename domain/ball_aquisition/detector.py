from ..utils import measure_distance, center


class BallAquasitionDetector:
    def __init__(self):
        self.possession_threshold = 50
        self.min_frames = 11
        self.containment_threshold = 0.8

    def player_bbox_points(self, player, b_center):
        x_center = b_center[0]
        y_center = b_center[1]

        x1, y1, x2, y2 = player
        width = x2 - x1
        height = y2 - y1

        output_points = []

        if y1 < y_center < y2:
            output_points.append((x1, y_center))
            output_points.append((x2, y_center))

        if x1 < x_center < x2:
            output_points.append((x_center, y1))
            output_points.append((x_center, y2))

        output_points += [
            (x1, y1), # Top Left Corner
            (x2, y1), # Top Right Corner
            (x1, y2), # Bottom Left Corner
            (x2, y2), # Bottom Right Corner
            (x1 + width // 2, y1), # Top Center
            (x1 + width // 2, y2), # Bottom Center
            (x1, y1 + height // 2), # Left Center
            (x2, y1 + height // 2) # Right Center
        ]

        return output_points

    def min_distance(self, b_center, player):
        key_points = self.player_bbox_points(player, b_center)

        return min(measure_distance(center, key_point) for key_point in key_points)

    def containment_ratio(self, player, ball):
        px1, py1, px2, py2 = player
        bx1, by1, bx2, by2 = ball

        ball_area = (bx2 - bx1) * (by2 - by1)

        intersection_x1 = max(px1, bx1)
        intersection_y1 = max(py1, by1)
        intersection_x2 = min(px2, bx2)
        intersection_y2 = min(py2, by2)

        if intersection_x2 < intersection_x1 or intersection_y2 < intersection_y1:
            return 0

        intersection_area = (intersection_x2 - intersection_x1) * (intersection_y2 - intersection_y1)

        containment_ratio = intersection_area / ball_area

        return containment_ratio


    def candidate(self, b_center, player_tracks, ball):
        close_players = []
        other_players = []

        for player_id, player_info in player_tracks.items():
            player = player_info.get("bbox", [])

            if not player:
                continue

            containment = self.containment_ratio(player, ball)
            min_distance = self.min_distance(b_center, player)

            if containment > self.containment_threshold:
                close_players.append((player_id, containment))
            else:
                other_players.append((player_id, min_distance))

        # First Priority close_players
        if close_players:
            best_candidate = max(close_players, key= lambda x: x[1])
            return best_candidate[0]

        # Second Priority other_players
        if other_players:
            best_candidate = min(other_players, key= lambda x: x[1])
            if best_candidate[1] < self.possession_threshold:
                return best_candidate[0]

        return -1

    def get_ball_handler(self, player_tracks, ball_tracks):
        num_frames = len(ball_tracks)
        possession_list = [-1] * num_frames
        possession_count = {}

        for num in range(num_frames):
            ball_info = ball_tracks[num].get(1, {})

            if not ball_info:
                continue

            ball = ball_info.get('bbox', [])
            if not ball:
                continue

            b_center = center(ball)

            player_id = self.candidate(b_center, player_tracks[num], ball)

            if player_id != -1:
                num_consecutive_frames = possession_count.get(player_id, 0) + 1
                possession_count = {player_id : num_consecutive_frames}

                if possession_count[player_id] >= self.possession_threshold:
                    possession_list[num] = player_id

            else:
                possession_count = {}

        return possession_list



