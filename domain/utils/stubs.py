import os
import pickle


def save_stub(stub_path, data):
    if not os.path.exists(os.path.dirname(stub_path)):
        os.mkdir(os.path.dirname(stub_path))

    if stub_path is not None:
        with open(stub_path, 'wb') as f:
            pickle.dump(data, f)

def read_stub(read_stubb, stub_path):
    if read_stubb and stub_path is not None and os.path.exists(stub_path):
        with open(stub_path, 'rb') as f:
            data = pickle.load(f)
            return data
    return None


