import cv2
import os

def read_video(video_path):
    """
    Lies alle Frames und die FPS eines Videos aus.

    Args:
        video_path (str): Pfad zum Video.

    Returns:
        tuple: (frames, fps)
            - frames: Liste der Videoframes
            - fps: Bilder pro Sekunde (float)
    """
    cap = cv2.VideoCapture(video_path)
    frames = []

    if not cap.isOpened():
        raise FileNotFoundError(f"Video konnte nicht geöffnet werden: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)

    cap.release()
    return frames, fps

def save_video(output_frames, output_path, fps):
    """
    Speichert Frames als Video, mit angegebener FPS.

    Args:
        output_frames (list): Liste der Frames.
        output_path (str): Pfad für das gespeicherte Video.
        fps (float): Originale FPS, die verwendet werden sollen.
    """
    if not output_frames:
        raise ValueError("Keine Frames zum Speichern vorhanden.")

    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)

    fourcc = cv2.VideoWriter_fourcc(*"XVID")
    out = cv2.VideoWriter(output_path, fourcc, fps, (output_frames[0].shape[1], output_frames[0].shape[0]))

    for frame in output_frames:
        out.write(frame)

    out.release()

def read_live_frame(source=0):
    return cv2.VideoCapture(source)

def show_live_output(frame, window_name="Live"):
    cv2.imshow(window_name, frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        return False
    return True