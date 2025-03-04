import os
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from data_loader import load_data

IMG_HEIGHT = 378
IMG_WIDTH = 600
MODEL_PATH = 'bounding_box_detector.h5'
TEST_IMAGE_PATH = 'data/Generated_cards/eszemelyi_with_Abért_Judit.jpg'

def bounding_box_accuracy(y_true, y_pred):
    """
    Calculate bounding box accuracy between true and predicted values.
    """
    return tf.reduce_mean(tf.cast(tf.abs(y_true - y_pred) < 0.05, tf.float32))

def predict_and_plot(image_path, model):
    """
    Load an image, predict bounding boxes, and display results.
    """
    # Load and preprocess image
    image = load_img(image_path, target_size=(IMG_HEIGHT, IMG_WIDTH))
    image_array = img_to_array(image) / 255.0
    image_array = np.expand_dims(image_array, axis=0)

    # Predict bounding boxes
    pred_boxes = model.predict(image_array)[0]

    # Display image
    plt.figure(figsize=(12, 8))
    plt.imshow(image)

    # Draw bounding boxes
    for i in range(0, len(pred_boxes), 8):
        # Extract 4 points
        points = pred_boxes[i:i+8]
        points_denormalized = [
            (points[j] * IMG_WIDTH, points[j+1] * IMG_HEIGHT) 
            for j in range(0, 8, 2)
        ]

        # Create polygon patch
        polygon = Polygon(
            points_denormalized, 
            fill=False, 
            edgecolor='red', 
            linewidth=2
        )
        plt.gca().add_patch(polygon)

    plt.title("Bounding Box Prediction")
    plt.axis('tight')
    plt.show()

print("Loading saved model...")
model = load_model(MODEL_PATH, custom_objects={'bounding_box_accuracy': bounding_box_accuracy})

if os.path.exists(TEST_IMAGE_PATH):
    print(f"Loading test image: {TEST_IMAGE_PATH}")
    predict_and_plot(TEST_IMAGE_PATH, model)
else:
    print(f"ERROR: Test image not found at path: {TEST_IMAGE_PATH}")