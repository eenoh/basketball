from domain.drawers.utils import draw_ellipse  # Optional, falls ellipse auch gebraucht wird
from .utils import draw_triangle  # <- wichtig: korrekter Import

class BallTracksDrawer:
    """
    Eine Klasse zum Zeichnen von Ballpositionen auf Videoframes.
    """

    def __init__(self):
        # Farbe für die Ballanzeige (BGR)
        self.ball_pointer_color = (0, 255, 0)

    def draw(self, frames, tracks):
        """
        Zeichnet Ballzeiger auf jedes Videoframe basierend auf den Trackingdaten.

        Args:
            frames (list): Liste von Frames (als NumPy-Arrays).
            tracks (list[dict]): Liste von Dictionaries, jedes mit Ball-Infos für ein Frame.

        Returns:
            list: Liste der Frames mit eingezeichneten Ballpositionen.
        """
        output_frames = []

        for num, frame in enumerate(frames):
            frame = frame.copy()
            ball_dict = tracks[num]

            for _, ball in ball_dict.items():
                bbox = ball.get("bbox")
                if bbox is None:
                    continue

                # Triangle-Zeichnung
                frame = draw_triangle(frame, bbox, self.ball_pointer_color)

            output_frames.append(frame)

        return output_frames

    def draw_single(self, frame, ball_dict):
        frame = frame.copy()
        for _, ball in ball_dict.items():
            bbox = ball.get("bbox")
            if bbox:
                frame = draw_triangle(frame, bbox, self.ball_pointer_color)
        return frame
