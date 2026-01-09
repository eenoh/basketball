from domain.utils import read_video, save_video
from domain.trackers import PlayerTracker, BallTracker
from domain.drawers import(PlayerTracksDrawer, BallTracksDrawer, CourtKeypointDrawer, TacticalViewDrawer)
from domain.team_assigner import TeamAssigner
from domain.ball_aquisition import BallAquasitionDetector
from domain.ball_tracking import PassInterceptionDetector
from domain.court_keypoint_detector import CourtKeypointDetector
from domain.tactical_view_converter import TacticalViewConverter


def main():

    # Read Video
    frames, fps = read_video("input_videos/test2.mp4")

    # Initialize Tracker
    player_tracker = PlayerTracker("models/player_detection.pt")
    ball_tracker = BallTracker("models/ball_detector_model.pt")

    # Initialize Court Keypoint Detector
    court_keypoint_detector = CourtKeypointDetector("models/court_keypoint_detector.pt")

    # Run Trackers
    player_tracks = player_tracker.get_object_tracks(frames, stub=True, stub_path="stubs/player_tracks.pkl")

    ball_tracks = ball_tracker.get_object_tracks(frames, stub=True, stub_path="stubs/ball_tracks.pkl")

    # Get Court Keypoints
    court_keypoints = court_keypoint_detector.get_court_keypoints(frames, read_stubb=True, stub_path="stubs/court_key_points.pkl")

    # Remove Wrong Detections
    ball_tracks = ball_tracker.remove_wrong_detections(ball_tracks)

    # Interpolate Ball Tracks
    ball_tracks = ball_tracker.interpolate_ball_positions(ball_tracks)

    # Assign Player Teams
    assigner = TeamAssigner()
    player_assignment = assigner.track_player_teams(frames, player_tracks, read_stubb=True, stub_path="stubs/player_assignment.pkl")

    # Ball Acquasition
    acquasition_detector = BallAquasitionDetector()
    ball_aquasition = acquasition_detector.get_ball_handler(player_tracks, ball_tracks)

    # Detect Passes and Interceptions
    pass_interception_detector = PassInterceptionDetector
    passes = pass_interception_detector.detect_passes(ball_aquasition, player_assignment)
    interceptions = pass_interception_detector.detect_interceptions(ball_aquasition, player_assignment)

    # Tactical View
    tactical_view_converter = TacticalViewConverter(court_image_path="D:\AI-Referee\ai-referee\public\basketball_court.png")
    court_keypoints = tactical_view_converter.validate(court_keypoints)
    tactical_player_positions = tactical_view_converter.map_to_tactic(court_keypoints, player_tracks)

    # Draw Output
    # Drawers inizialisieren
    player_drawer = PlayerTracksDrawer()
    ball_drawer = BallTracksDrawer()
    court_keypoints_drawer = CourtKeypointDrawer()
    tactical_view_drawer = TacticalViewDrawer()

    # Draw Object Tracks
    output_frames = player_drawer.draw(frames, player_tracks, player_assignment, acquasition_detector)
    output_frames = ball_drawer.draw(output_frames, ball_tracks)

    # Draw Court Keypoints
    output_frames = court_keypoints_drawer.draw(output_frames, court_keypoints)

    # Tactical View
    output_frames = tactical_view_drawer.draw(output_frames, tactical_view_converter.court_image_path, tactical_view_converter.width, tactical_view_converter.height, tactical_view_converter.key_points, tactical_player_positions, player_assignment, ball_aquasition)


    # Safe Video
    save_video(output_frames, "output_videos/output_video.avi", fps)

if __name__ == "__main__":
    main()
