import os
import json
import numpy as np
import cv2
from sklearn.model_selection import train_test_split
import logging
import glob
from pathlib import Path

# Logging beállítása
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Adatbeállítások - abszolút útvonalak használata
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data", "Generated_cards")
LABELS_DIR = os.path.join(DATA_DIR, "json_labels")
IMAGE_SIZE = (190, 270)

def load_data():
    """
    Betölti a képeket és a hozzájuk tartozó nemi címkéket a JSON fájlokból.
    Returns:
        tuple: (képek tömbje, címkék tömbje, sikeres/sikertelen betöltések száma)
    """
    images, labels = [], []
    success_count, error_count = 0, 0
    
    # Ellenőrizzük, hogy létezik-e a könyvtár
    if not os.path.exists(LABELS_DIR):
        logging.error(f"A címke könyvtár nem található: {LABELS_DIR}")
        return np.array(images), np.array(labels), (0, 0)
    
    json_files = sorted([f for f in os.listdir(LABELS_DIR) if f.endswith(".json")])
    logging.info(f"Talált JSON fájlok száma: {len(json_files)}")
    
    for json_file in json_files:
        try:
            json_path = os.path.join(LABELS_DIR, json_file)
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                img_path = os.path.join(DATA_DIR, data["image"])
                
                # Pathlib használata a jobb Unicode kezelésért
                img_pathlib = Path(img_path)
                
                # Ellenőrizzük, hogy létezik-e a kép
                if not img_pathlib.exists():
                    logging.warning(f"Kép nem található: {img_path}")
                    
                    # Próbáljuk megtalálni a fájlt a kiterjesztés alapján
                    img_name_without_ext = os.path.splitext(data["image"])[0]
                    possible_files = list(Path(DATA_DIR).glob(f"{img_name_without_ext}.*"))
                    
                    if possible_files:
                        img_pathlib = possible_files[0]
                        logging.info(f"Alternatív kép megtalálva: {img_pathlib}")
                    else:
                        error_count += 1
                        continue
                
                # Betöltjük a képet különböző módszerekkel
                try:
                    # 1. próba: OpenCV normál betöltés
                    image = cv2.imread(str(img_pathlib))
                    
                    # 2. próba: OpenCV IMREAD_UNCHANGED flag
                    if image is None:
                        image = cv2.imread(str(img_pathlib), cv2.IMREAD_UNCHANGED)
                    
                    # 3. próba: RGB átalakítás után
                    if image is None:
                        # Numpy és PIL kombinációja
                        from PIL import Image
                        pil_image = Image.open(img_pathlib)
                        image = np.array(pil_image.convert('RGB'))
                        # BGR konverzió OpenCV számára
                        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
                    
                    if image is None:
                        logging.warning(f"Nem sikerült betölteni a képet: {img_pathlib}")
                        error_count += 1
                        continue
                        
                except Exception as e:
                    logging.error(f"Képbetöltési hiba: {str(e)}")
                    error_count += 1
                    continue
                
                # Megkeressük a nemi és az arcképet tartalmazó címkéket
                gender, face_box = None, None
                for label in data["labels"]:
                    if label["label"] == "Gender":
                        gender = 0 if label["text"] == "N" else 1
                    if label["label"] == "Image":
                        face_box = label["box"]
                
                if gender is None:
                    logging.warning(f"Nincs nemi címke: {json_file}")
                    error_count += 1
                    continue
                    
                if face_box is None or len(face_box) < 4:
                    logging.warning(f"Hibás arckép határolókeret: {json_file}")
                    error_count += 1
                    continue
                
                # Arc kivágása a határolókeret alapján
                try:
                    x_min = min(p[0] for p in face_box)
                    y_min = min(p[1] for p in face_box)
                    x_max = max(p[0] for p in face_box)
                    y_max = max(p[1] for p in face_box)
                    
                    # Ellenőrizzük, hogy érvényes-e a kivágás
                    if x_min >= x_max or y_min >= y_max:
                        logging.warning(f"Érvénytelen határolókeret koordináták: {json_file}")
                        error_count += 1
                        continue
                    
                    # Ellenőrizzük, hogy a határok a kép méretén belül vannak-e
                    height, width = image.shape[:2]
                    x_min = max(0, int(x_min))
                    y_min = max(0, int(y_min))
                    x_max = min(width, int(x_max))
                    y_max = min(height, int(y_max))
                    
                    # Ellenőrizzük, hogy a kivágás lehetséges-e
                    if x_min >= width or y_min >= height or x_max <= 0 or y_max <= 0:
                        logging.warning(f"Érvénytelen kivágási terület: {json_file}")
                        error_count += 1
                        continue
                    
                    face = image[y_min:y_max, x_min:x_max]
                    
                    # Ellenőrizzük, hogy a kivágott kép nem üres
                    if face.size == 0:
                        logging.warning(f"Üres arckép kivágás: {json_file}")
                        error_count += 1
                        continue
                    
                    # Kép előkészítése a modell számára
                    face = cv2.resize(face, IMAGE_SIZE)
                    face = face / 255.0  # Normalizálás
                    
                    images.append(face)
                    labels.append(gender)
                    success_count += 1
                    
                except Exception as e:
                    logging.error(f"Hiba a kép feldolgozásakor {json_file}: {str(e)}")
                    error_count += 1
                    continue
                    
        except Exception as e:
            logging.error(f"Hiba a JSON feldolgozásakor {json_file}: {str(e)}")
            error_count += 1
            continue
    
    logging.info(f"Sikeres betöltések: {success_count}, Hibák: {error_count}")
    return np.array(images), np.array(labels), (success_count, error_count)

def prepare_data():
    """
    Betölti és felosztja az adatokat tanítási, validációs és teszt halmazokra.
    Returns:
        tuple: (X_train, X_val, X_test, y_train, y_val, y_test)
    """
    # Betöltjük az adatokat
    images, labels, stats = load_data()
    
    if len(images) == 0:
        logging.error("Nem sikerült adatokat betölteni!")
        return None, None, None, None, None, None
    
    logging.info(f"Összesen {len(images)} kép betöltve")
    
    # Adatok felosztása
    X_train, X_test, y_train, y_test = train_test_split(images, labels, test_size=0.2, random_state=42)
    X_train, X_val, y_train, y_val = train_test_split(X_train, y_train, test_size=0.2, random_state=42)
    
    logging.info(f"Tanító adatok: {X_train.shape}, Validációs adatok: {X_val.shape}, Teszt adatok: {X_test.shape}")
    
    return X_train, X_val, X_test, y_train, y_val, y_test

if __name__ == "__main__":
    # Ha közvetlenül futtatják, teszteljük az adatbetöltést
    print("Adatbetöltési teszt futtatása...")
    images, labels, stats = load_data()
    print(f"Betöltött képek: {len(images)}")
    print(f"Betöltött címkék: {len(labels)}")
    print(f"Sikeres/hibás betöltések: {stats}")