import os
import cv2
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from mltu.inferenceModel import OnnxInferenceModel
from mltu.utils.text_utils import ctc_decoder, get_cer
from tqdm import tqdm
from mltu.configs import BaseModelConfigs

class ImageToWordModel(OnnxInferenceModel):
    def __init__(self, model_path, char_list):
        super().__init__(model_path)
        self.char_list = char_list
    
    def predict(self, image):
        image=cv2.resize(image, self.input_shape[:2][::-1])
        image_pred=np.expand_dims(image, axis=0).astype(np.float32)

        preds=self.model.run(None, {self.input_name: image_pred})[0]

        text=ctc_decoder(preds, self.char_list)[0]

        return text

# Flask inicializálása
app = Flask(__name__)

# Engedélyezett API kulcs (a Node.js backend használja)
API_KEY = "my_secret_api_key"

# Modell konfigurációk
IMG_HEIGHT = 378
IMG_WIDTH = 600
MODEL_PATH = 'bounding_box_detector.h5'
GENDER_MODEL_PATH = 'models/gender_classification_model.h5'
IMAGE_SIZE = (190, 270)  # A nemfelismerő modell bemeneti mérete

# OCR Modell betöltése
configs = BaseModelConfigs.load("Models/configs.yaml")
ocr_model = ImageToWordModel(model_path=configs.model_path, char_list=configs.vocab)

# Bounding Box Modell betöltése
def bounding_box_accuracy(y_true, y_pred):
    tolerance = 0.03
    diff = tf.abs(y_true - y_pred)
    correct = tf.cast(diff < tolerance, tf.float32)
    return tf.reduce_mean(correct)

print("Loading bounding box model...")
bbox_model = load_model(MODEL_PATH, custom_objects={'bounding_box_accuracy': bounding_box_accuracy})

# Nemfelismerő modell betöltése
print("Loading gender detection model...")
gender_model = load_model(GENDER_MODEL_PATH)

def four_point_transform(image, pts):
    """
    Perspektív transzformáció a ferde szövegrégiók kiegyenesítésére.
    """
    # Input pontok rendezése (bal-felső, jobb-felső, jobb-alsó, bal-alsó)
    rect = np.zeros((4, 2), dtype="float32")
    
    # Pontok összegének kiszámítása, a legkisebb a bal-felső, legnagyobb a jobb-alsó
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    
    # Különbségek a jobb-felső és bal-alsó meghatározásához
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    
    # Cél méret kiszámítása
    widthA = np.sqrt(((rect[2][0] - rect[3][0]) ** 2) + ((rect[2][1] - rect[3][1]) ** 2))
    widthB = np.sqrt(((rect[1][0] - rect[0][0]) ** 2) + ((rect[1][1] - rect[0][1]) ** 2))
    maxWidth = max(int(widthA), int(widthB))
    
    heightA = np.sqrt(((rect[1][0] - rect[2][0]) ** 2) + ((rect[1][1] - rect[2][1]) ** 2))
    heightB = np.sqrt(((rect[0][0] - rect[3][0]) ** 2) + ((rect[0][1] - rect[3][1]) ** 2))
    maxHeight = max(int(heightA), int(heightB))
    
    # Cél koordináták
    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]
    ], dtype="float32")
    
    # Perspektív transzformáció
    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
    
    return warped

# Nemfelismerő függvény
def detect_gender(face_image):
    """
    Felismeri a nemet a kapott arcképen.
    """
    # Kép előkészítése a modell számára
    face_image = cv2.resize(face_image, IMAGE_SIZE)
    face_image = face_image / 255.0  # Normalizálás
    face_image = np.expand_dims(face_image, axis=0)
    
    # Nem predikció
    prediction = gender_model.predict(face_image)[0][0]
    gender = "Férfi" if prediction > 0.5 else "Nő"
    confidence = prediction if prediction > 0.5 else 1 - prediction
    
    return gender, float(confidence)

# API kulcs ellenőrzése
def verify_api_key(request):
    api_key = request.headers.get("X-API-KEY")
    return api_key == API_KEY

def process_image(image_path):
		image = cv2.imread(image_path)
		img_height, img_width = image.shape[:2]
		
		resized_image = cv2.resize(image, (IMG_WIDTH, IMG_HEIGHT))
		
		norm_image = resized_image / 255.0
		
		pred_boxes = bbox_model.predict(np.expand_dims(norm_image, axis=0))[0]
		
		pred_boxes_original = []
		for i in range(0, len(pred_boxes), 2):
			x = int(pred_boxes[i] * img_width)
			y = int(pred_boxes[i+1] * img_height)
			pred_boxes_original.append([x, y])
		
		fields = {}
		field_names = ["Név", "Személyi szám", "CAN", "Fénykép", "Születési dátum", "Lejárati dátum"]
		
		face_image = None
		
		for i, name in enumerate(field_names):
			pts = np.array(pred_boxes_original[i*4:(i+1)*4], dtype="float32")
		
			warped = four_point_transform(image, pts)
		
			if name == "Fénykép":
				face_image = warped
				continue
		
			text = ocr_model.predict(warped)
			fields[name] = text
		
		if face_image is not None:
			gender, confidence = detect_gender(face_image)
			fields["Nem"] = gender
			fields["Nem_konfidencia"] = confidence
		
		return fields

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

    # Kép feldolgozása (bounding box + OCR + gender detection)
    try:
        extracted_data = process_image(file_path)

        # Fájl törlése a feldolgozás után
        os.remove(file_path)

        return jsonify({"extracted_data": extracted_data})
    except Exception as e:
        # Hibajelentés és fájl törlése
        if os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({"error": str(e)}), 500

# Főfüggvény
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)