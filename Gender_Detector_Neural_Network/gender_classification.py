import os
import json
import numpy as np
import tensorflow as tf
import cv2
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split

# Adatbeállítások
IMAGE_SIZE = (190, 270)
DATA_DIR = "data/Generated_cards/"
LABELS_DIR = "data/Generated_cards/json_labels/"

def load_data():
    images, labels = [], []
    json_files = [f for f in os.listdir(LABELS_DIR) if f.endswith(".json")]
    
    for json_file in json_files:
        with open(os.path.join(LABELS_DIR, json_file), "r", encoding="utf-8") as f:
            data = json.load(f)
            img_path = os.path.join(DATA_DIR, data["image"])
            
            # Betöltjük a képet
            image = cv2.imread(img_path)
            if image is None:
                continue  # Ha a kép nem elérhető, ugorjuk át
            
            # Megkeressük a nemi és az arcképet tartalmazó címkéket
            gender, face_box = None, None
            for label in data["labels"]:
                if label["label"] == "Gender":
                    gender = 0 if label["text"] == "N" else 1
                if label["label"] == "Image":
                    face_box = label["box"]
            
            if gender is None or face_box is None:
                continue  # Ha nincs nem vagy kép, kihagyjuk
            
            # Arc kivágása a bounding box alapján
            x_min = min(p[0] for p in face_box)
            y_min = min(p[1] for p in face_box)
            x_max = max(p[0] for p in face_box)
            y_max = max(p[1] for p in face_box)
            face = image[y_min:y_max, x_min:x_max]
            
            # Kép előkészítése a modell számára
            face = cv2.resize(face, IMAGE_SIZE)
            face = face / 255.0  # Normalizálás
            
            images.append(face)
            labels.append(gender)
    
    return np.array(images), np.array(labels)

# Betöltjük az adatokat
images, labels = load_data()

# Adatok felosztása
X_train, X_test, y_train, y_test = train_test_split(images, labels, test_size=0.2, random_state=42)
X_train, X_val, y_train, y_val = train_test_split(X_train, y_train, test_size=0.2, random_state=42)

# CNN modell létrehozása
def build_model():
    model = keras.Sequential([
        layers.Conv2D(32, (3, 3), activation="relu", input_shape=(*IMAGE_SIZE, 3)),
        layers.MaxPooling2D(2, 2),
        layers.Conv2D(64, (3, 3), activation="relu"),
        layers.MaxPooling2D(2, 2),
        layers.Conv2D(128, (3, 3), activation="relu"),
        layers.MaxPooling2D(2, 2),
        layers.Flatten(),
        layers.Dense(128, activation="relu"),
        layers.Dropout(0.5),
        layers.Dense(1, activation="sigmoid")  # Bináris osztályozásra
    ])
    model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])
    return model

# Modell létrehozása és tanítása
model = build_model()
model.fit(X_train, y_train, validation_data=(X_val, y_val), epochs=10, batch_size=32)

# Modell kiértékelése
test_loss, test_acc = model.evaluate(X_test, y_test)
print(f"Teszt pontosság: {test_acc:.4f}")

# Modell mentése
model.save("gender_classification_model.h5")
