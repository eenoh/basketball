


class PassInterceptionDetector:
    def __init__(self):
        pass

    def detect_passes(self, ball_aquasition, player_assignment):
        passes = [-1] * len(ball_aquasition)
        prev_holder = -1
        prev_frame = -1

        for frame in range(1, len(ball_aquasition)):
            if ball_aquasition[frame -1] != -1:
                prev_holder = ball_aquasition[frame -1]
                prev_frame = frame -1

            curr_holder = ball_aquasition[frame]

            if prev_holder != -1 and curr_holder != -1 and prev_holder != curr_holder:
                prev_team = player_assignment[prev_frame].get(prev_holder, -1)
                curr_team = player_assignment[frame].get(curr_holder, -1)

                if prev_team == curr_team and prev_team != -1:
                    passes[frame] = prev_team

        return passes

    def detect_interceptions(self, ball_aquasition, player_assignment):
        interceptions = [-1] * len(ball_aquasition)
        prev_holder = -1
        prev_frame = -1

        for frame in range(1, len(ball_aquasition)):
            if ball_aquasition[frame -1] != -1:
                prev_holder = ball_aquasition[frame -1]
                prev_frame = frame -1

            curr_holder = ball_aquasition[frame]

            if prev_holder != -1 and curr_holder != -1 and prev_holder != curr_holder:
                prev_team = player_assignment[prev_frame].get(prev_holder, -1)
                curr_team = player_assignment[frame].get(curr_holder, -1)

                if prev_team != curr_team and prev_team != -1 and curr_team != -1:
                    interceptions[frame] = prev_team

        return interceptions

