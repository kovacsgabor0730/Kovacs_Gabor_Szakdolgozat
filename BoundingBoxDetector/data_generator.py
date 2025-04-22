import os
import json
import numpy as np
from tensorflow.keras.utils import Sequence
from tensorflow.keras.preprocessing.image import load_img, img_to_array

class BoundingBoxDataGenerator(Sequence):
    def __init__(self, image_dir, json_dir, batch_size=8, img_height=378, img_width=600, shuffle=True):
        self.image_dir = image_dir
        self.json_dir = json_dir
        self.batch_size = batch_size
        self.img_height = img_height
        self.img_width = img_width
        self.shuffle = shuffle
        
        # Összeállítjuk a JSON fájlok listáját
        self.json_files = []
        for json_file in os.listdir(json_dir):
            if json_file.endswith('.json'):
                self.json_files.append(json_file)
                
        self.indexes = np.arange(len(self.json_files))
        if self.shuffle:
            np.random.shuffle(self.indexes)
    
    def __len__(self):
        # Meghatározza a batch-ek számát egy teljes epoch során
        return int(np.ceil(len(self.json_files) / self.batch_size))
    
    def __getitem__(self, index):
        # Kiválasztjuk a batch-hez tartozó indexeket
        batch_indexes = self.indexes[index * self.batch_size:
                                    min((index + 1) * self.batch_size, len(self.json_files))]
        
        batch_json_files = [self.json_files[idx] for idx in batch_indexes]
        
        # Betöltjük a képeket és a bounding box-okat
        images = []
        boxes = []
        
        for json_file in batch_json_files:
            with open(os.path.join(self.json_dir, json_file), 'r') as f:
                data = json.load(f)
            
            # Kép betöltése és átméretezése
            image_path = os.path.join(self.image_dir, data['image'])
            img = load_img(image_path, target_size=(self.img_height, self.img_width))
            img_array = img_to_array(img) / 255.0
            images.append(img_array)
            
            # Bounding box-ok feldolgozása
            image_boxes = []
            for label in data['labels']:
                points = label['box']
                if label['label'] == 'Gender':
                    continue
                for point in points:
                    x, y = point
                    image_boxes.extend([x / self.img_width, y / self.img_height])
            
            boxes.append(image_boxes)
        
        return np.array(images), np.array(boxes)
    
    def on_epoch_end(self):
        # Epoch végén újrakeverjük az adatokat, ha szükséges
        if self.shuffle:
            np.random.shuffle(self.indexes)