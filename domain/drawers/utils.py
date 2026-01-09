from curses.textpad import rectangle
from ..utils import center, width

import cv2
import numpy as np

def draw_triangle(frame, bbox, color):
    y = int(bbox[1])
    x,_ = center(bbox)

    triangle_points = np.array([
        [x,y],
        [x - 10, y - 20],
        [x + 10, y - 20]
    ])

    cv2.drawContours(frame, [triangle_points], 0, color, cv2.FILLED)
    cv2.drawContours(frame, [triangle_points], 0, (0, 0, 0), 2)

    return frame


def draw_ellipse(frame, bbox, color, track_id=None):
    y2 = int(bbox[3])
    x_center,_ = center(bbox)
    widthh = width(bbox)

    cv2.ellipse(frame,
                center=(x_center, y2),
                axes=(int(widthh), int(0.35 * widthh)),
                angle=0,
                startAngle=-45,
                endAngle=235,
                color=color,
                thickness=2,
                lineType=cv2.LINE_4
                )

    rect_width = 40
    rect_height = 20
    x1_rect = x_center - rect_width//2
    x2_rect = x_center + rect_width//2
    y1_rect = (y2 - rect_height//2) + 15
    y2_rect = (y2 + rect_height//2) + 15

    if track_id is not None:
        cv2.rectangle(
            frame,
            (int(x1_rect), int(y1_rect)),
            (int(x2_rect), int(y2_rect)),
            color,
            cv2.FILLED)

        x1_text = x1_rect + 12
        if track_id > 99:
            x1_text -= 10

        cv2.putText(
            frame,
            str(track_id),
            (x1_rect, y1_rect + 15),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 0, 0),
            2
        )
    return frame