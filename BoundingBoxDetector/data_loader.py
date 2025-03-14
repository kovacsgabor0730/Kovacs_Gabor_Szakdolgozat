import os
import json
import numpy as np
from tensorflow.keras.preprocessing.image import load_img, img_to_array

IMG_WIDTH = 600
IMG_HEIGHT = 378
NUM_BOXES = 6
BOX_OUTPUT = NUM_BOXES * 8

def load_data(image_dir, json_dir):
    images = []
    boxes = []

    for json_file in os.listdir(json_dir):
        if not json_file.endswith('.json'):
            continue
        with open(os.path.join(json_dir, json_file), 'r') as f:
            data = json.load(f)

        # Load and resize image
        image_path = os.path.join(image_dir, data['image'])
        img = load_img(image_path, target_size=(IMG_HEIGHT, IMG_WIDTH))
        img_array = img_to_array(img) / 255.0
        images.append(img_array)

        image_boxes = []
        for label in data['labels']:
            points = label['box']
            if label['label']=='Gender':
                continue
            for point in points:
                x, y = point
                image_boxes.extend([x / IMG_WIDTH, y / IMG_HEIGHT])

        boxes.append(image_boxes)

    return np.array(images), np.array(boxes)

if __name__ == "__main__":
    IMAGE_DIR = 'data/Generated_cards'
    JSON_DIR = 'data/Generated_cards/json_labels'

    X, y = load_data(IMAGE_DIR, JSON_DIR)
    print(f"Képek alakja: {X.shape}")
    print(f"Bounding box-ok alakja: {y.shape}")
