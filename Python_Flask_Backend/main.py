import os
import cv2
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from mltu.inferenceModel import OnnxInferenceModel

# Flask inicializálása
app = Flask(__name__)

# Engedélyezett API kulcs (a Node.js backend használja)
API_KEY = "my_secret_api_key"

# Modell konfigurációk
IMG_HEIGHT = 378
IMG_WIDTH = 600
MODEL_PATH = 'bounding_box_detector.h5'

# OCR Modell betöltése
configs = BaseModelConfigs.load("Models/configs.yaml")
ocr_model = ImageToWordModel(model_path=configs.model_path, char_list=configs.vocab)

# Bounding Box Modell betöltése
def bounding_box_accuracy(y_true, y_pred):
    return tf.reduce_mean(tf.cast(tf.abs(y_true - y_pred) < 0.05, tf.float32))

print("Loading bounding box model...")
bbox_model = load_model(MODEL_PATH, custom_objects={'bounding_box_accuracy': bounding_box_accuracy})

def four_point_transform(image, pts):
    """
    Perspektív transzformáció a ferde szövegrégiók kiegyenesítésére.
    """
    rect = np.array(pts, dtype="float32")

    widthA = np.linalg.norm(rect[0] - rect[1])
    widthB = np.linalg.norm(rect[2] - rect[3])
    maxWidth = max(int(widthA), int(widthB))

    heightA = np.linalg.norm(rect[0] - rect[3])
    heightB = np.linalg.norm(rect[1] - rect[2])
    maxHeight = max(int(heightA), int(heightB))

    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]
    ], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))

    return warped

# API kulcs ellenőrzése
def verify_api_key(request):
    api_key = request.headers.get("X-API-KEY")
    return api_key == API_KEY

# Kép feldolgozása bounding boxokkal és OCR-rel
def process_image(image_path):
    """
    Betölti a képet, felismeri a bounding boxokat, kiegyenesíti őket,
    majd OCR-t futtat rajtuk.
    """
    original_image = cv2.imread(image_path)
    orig_h, orig_w, _ = original_image.shape

    # Kép előfeldolgozása a bounding box modellhez
    image_resized = load_img(image_path, target_size=(IMG_HEIGHT, IMG_WIDTH))
    image_array = img_to_array(image_resized) / 255.0
    image_array = np.expand_dims(image_array, axis=0)

    # Bounding box detekció
    pred_boxes = bbox_model.predict(image_array)[0]

    texts = []

    for i in range(0, len(pred_boxes), 8):
        points = pred_boxes[i:i+8]
        
        # Bounding box koordináták visszaskálázása az eredeti kép méreteire
        points_denorm = np.array([(int(points[j] * orig_w), int(points[j+1] * orig_h)) for j in range(0, 8, 2)])

        # Szövegdoboz kiegyenesítése
        straightened = four_point_transform(original_image, points_denorm)

        # OCR előfeldolgozás
        crop_resized = cv2.resize(straightened, (ocr_model.input_shapes[0][1], ocr_model.input_shapes[0][2]))
        crop_resized = np.expand_dims(crop_resized, axis=0).astype(np.float32)

        # OCR predikció
        text_prediction = ocr_model.predict(crop_resized)
        texts.append(text_prediction)

    return texts

# Flask API végpont a kép feltöltéséhez és feldolgozásához
@app.route("/upload", methods=["POST"])
def upload_file():
    if not verify_api_key(request):
        return jsonify({"error": "Unauthorized"}), 403

    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # Kép mentése ideiglenesen
    file_path = os.path.join("uploads", file.filename)
    os.makedirs("uploads", exist_ok=True)
    file.save(file_path)

    # Kép feldolgozása (bounding box + OCR)
    try:
        texts = process_image(file_path)

        # Fájl törlése a feldolgozás után
        os.remove(file_path)

        return jsonify({"extracted_texts": texts})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Főfüggvény
if __name__ == "__main__":
    app.run(debug=True)
