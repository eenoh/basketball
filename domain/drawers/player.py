from .utils import draw_ellipse, draw_triangle


class PlayerTracksDrawer:
    def __init__(self, home_team_color=(255, 245, 238), away_team_color=(128, 0, 0), ball_possession_color=(0, 0, 255)):
        self.default_team = 1
        self.home_team_color = home_team_color
        self.away_team_color = away_team_color
        self.ball_possession_color = ball_possession_color

    def draw(self, frames, tracks, player_assignment, ball_aquisition):
        output_frames = []

        for num, frame in enumerate(frames):
            frame = frame.copy()

            player_dict = tracks[num]
            frame_assignment = player_assignment[num]
            has_ball = ball_aquisition[num]

            for track_id, player in player_dict.items():
                if player.get("bbox") is None:
                    continue

                team_id = frame_assignment.get(track_id, self.default_team)
                color = self.home_team_color if team_id == 1 else self.away_team_color

                if track_id == has_ball:
                    frame = draw_triangle(frame, player["bbox"], self.ball_possession_color)

                frame = draw_ellipse(frame, player["bbox"], color, track_id)

            output_frames.append(frame)

        return output_frames

    def draw_single(self, frame, tracks, team_assignment=None, ball_handler=None):
        frame = frame.copy()

        for track in tracks.values():
            bbox = track.get("bbox")
            track_id = track.get("id")

            if bbox is None:
                continue

            team_color = (128, 128, 128)  # fallback gray
            if team_assignment:
                team = team_assignment.get(track_id)
                if team == 1:
                    team_color = self.home_team_color
                elif team == 2:
                    team_color = self.away_team_color

            if ball_handler is not None and track_id == ball_handler:
                frame = draw_ellipse(frame, bbox, self.ball_possession_color, track_id)
            else:
                frame = draw_ellipse(frame, bbox, team_color, track_id)

        return frame
