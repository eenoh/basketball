from domain.drawers import CourtKeypointDrawer, TacticalViewDrawer
from team_assigner import TeamAssigner
from ball_aquisition import BallAquasitionDetector
from ball_tracking import PassInterceptionDetector
from court_keypoint_detector import CourtKeypointDetector
from tactical_view_converter import TacticalViewConverter
from trackers import PlayerTracker, BallTracker
from drawers import PlayerTracksDrawer, BallTracksDrawer
from utils import read_live_frame, show_live_output


def live_main():
    # Initialisiere alle Modelle und Komponenten
    player_tracker = PlayerTracker("models/PoseDetectionMedium.pt")
    ball_tracker = BallTracker("models/ball_detector_model.pt")
    court_keypoint_detector = CourtKeypointDetector("models/court_keypoint_detector.pt")
    team_assigner = TeamAssigner()
    ball_acquisition = BallAquasitionDetector()
    pass_interception_detector = PassInterceptionDetector()
    tactical_converter = TacticalViewConverter("public/basketball_court.png")

    player_drawer = PlayerTracksDrawer()
    ball_drawer = BallTracksDrawer()
    court_drawer = CourtKeypointDrawer()
    tactical_drawer = TacticalViewDrawer()

    # Set up camera stream
    cap = read_live_frame(0)  # z.B. Kamera-ID 0

    print("🏀 Live-Erkennung läuft...")

    while True:
        frame = cap.read()
        if frame is None:
            break

        frame = frame[1].copy()

        # 1. Spieler- und Ball-Erkennung
        player_tracks = player_tracker.get_live_tracks(frame)
        ball_tracks = ball_tracker.get_live_tracks(frame)

        # 2. Spielfeldpunkte
        keypoints = court_keypoint_detector.get_live_keypoints(frame)

        # 3. Spieler-Teams zuweisen
        player_assignment = team_assigner.assign_live_teams(player_tracks)

        # 4. Ballbesitz ermitteln
        ball_handler = ball_acquisition.get_current_handler(player_tracks, ball_tracks)

        # 5. Pässe & Interceptions
        passes = pass_interception_detector.detect_live_passes(player_tracks, ball_tracks)
        interceptions = pass_interception_detector.detect_live_interceptions(player_tracks, ball_tracks)

        # 6. Taktische Positionen berechnen
        validated_keypoints = tactical_converter.validate([keypoints])[0]
        tactical_positions = tactical_converter.map_single_to_tactic(validated_keypoints, player_tracks)

        # 7. Zeichnen
        frame = player_drawer.draw_single(frame, player_tracks, player_assignment, ball_handler)
        frame = ball_drawer.draw_single(frame, ball_tracks)
        frame = court_drawer.draw([frame], [keypoints])[0]
        frame = tactical_drawer.draw_single(
            frame, tactical_converter.court_image_path,
            tactical_converter.width, tactical_converter.height,
            validated_keypoints, tactical_positions, player_assignment, ball_handler
        )

        # 8. Anzeige
        show_live_output(frame)

    cap.release()
    print("⚠️ Live-Erkennung gestoppt.")


if __name__ == "__main__":
    live_main()
