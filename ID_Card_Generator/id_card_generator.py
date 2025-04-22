import os
import json
import random
from PIL import Image, ImageDraw, ImageFont
from utils import generate_random_date, generate_doc_no, generate_can
from bounding_box_utils import calculate_bounding_boxes, rotate_point
from image_processing import augment_image_and_boxes, apply_image_enhancements
from datetime import datetime

class IDCardGenerator:
    def __init__(self):
        """
        Inicializálja az ID kártya generátort a szükséges beállításokkal.
        """
        # Betűtípus beállítások
        font_path_normal = "./data/fonts/Nexa Bold.otf"
        font_path_bold = "./data/fonts/VanillaExtractRegular.ttf"
        font_size = 21
        self.font_normal = ImageFont.truetype(font_path_normal, font_size)
        self.font_bold = ImageFont.truetype(font_path_bold, font_size)
        can_font_size = 28
        self.font_can = ImageFont.truetype(font_path_normal, can_font_size)
        
        # Pozíció beállítások
        self.name_position = (248, 97)
        self.doc_no_position = (485, 220)
        self.birthday_position = (465, 180)
        self.expiry_position = (465, 200)
        self.can_position = (280, 247)
        self.nf_position = (300, 160)
        self.image_position = (25, 82, 215, 352)
        
        # Output mappa
        os.makedirs('./data/Generated_cards/json_labels', exist_ok=True)
    
    def generate_id_card(self, person_data, photo_path):
        """
        Generál egy személyi igazolványt a megadott adatokkal.
        
        Args:
            person_data: A személy adatai (vezetéknév, keresztnév, nem)
            photo_path: Az arckép elérési útja
            
        Returns:
            tuple: Az augmentált kép, a mentés útvonalak és a címkék
        """
        # Személyi igazolvány alap betöltése
        id_card = Image.open('./data/eszemelyi-front_photoshoped.png').resize((600, 378))
        draw = ImageDraw.Draw(id_card)
        
        # Adatok előkészítése
        first_name, last_name, gender = person_data
        name = f"{first_name} {last_name}".upper()
        doc_no = generate_doc_no()
        birthday = generate_random_date(datetime(1950, 1, 1), datetime(2024, 12, 31))
        expiry = [birthday[0], birthday[1], str(random.randint(int(birthday[2]) + 10, 2034))]
        birthday_str = f"{birthday[0]}   {birthday[1]}    {birthday[2]}"
        expiry_str = f"{expiry[0]}   {expiry[1]}    {expiry[2]}"
        
        # Fénykép beillesztése
        new_photo = Image.open(photo_path)
        new_photo_resized = new_photo.resize((190, 270)).convert('L')
        id_card.paste(new_photo_resized, self.image_position)
        
        # Szövegek rajzolása
        draw.text(self.name_position, name, font=self.font_normal, fill="#787372")
        draw.text(self.doc_no_position, doc_no, font=self.font_normal, fill="#787372")
        draw.text(self.birthday_position, birthday_str, font=self.font_normal, fill="#787372")
        draw.text(self.expiry_position, expiry_str, font=self.font_normal, fill="#787372")
        
        # CAN szám generálása és rajzolása
        can_str = generate_can()
        draw.text(self.can_position, can_str, font=self.font_can, fill="#787372")
        
        # Nem beállítása (F/N)
        if gender == "F":
            draw.text(self.nf_position, "N/", font=self.font_bold, fill="#787372")
            draw.text((self.nf_position[0] + 30, self.nf_position[1]), "F", font=self.font_normal, fill="#787372")
            gender_value = "F"
        else:
            draw.text(self.nf_position, "N/", font=self.font_normal, fill="#787372")
            draw.text((self.nf_position[0] + 30, self.nf_position[1]), "F", font=self.font_bold, fill="#787372")
            gender_value = "N"
        
        # Befoglaló keretek számítása
        bounding_boxes = calculate_bounding_boxes(
            id_card, name, doc_no, birthday_str, expiry_str, can_str, "N/F",
            self.name_position, self.doc_no_position, self.birthday_position,
            self.expiry_position, self.can_position, self.nf_position, self.image_position,
            self.font_normal, self.font_can
        )
        
        # Kép augmentálása
        augmented_image, augmented_boxes, angle = augment_image_and_boxes(id_card, bounding_boxes)
        
        if augmented_image.mode == "RGBA":
            augmented_image = augmented_image.convert("RGB")
        
        # Kimeneti útvonalak
        output_image_path = f'./data/Generated_cards/eszemelyi_with_{first_name}_{last_name}.jpg'
        output_json_path = f'./data/Generated_cards/json_labels/{first_name}_{last_name}.json'
        
        # Címkék előkészítése
        label_data = {
            "image": f'eszemelyi_with_{first_name}_{last_name}.jpg',
            "labels": []
        }
        
        # Címkék generálása a befoglaló keretekhez
        for idx, field in enumerate(["Name", "Doc No", "Birthday", "Expiry", "CAN", "Gender", "Image"]):
            box = augmented_boxes[idx]
            x1, y1, x2, y2 = box
            
            # A befoglaló keret sarokpontjainak számítása
            x1r, y1r = rotate_point(x1, y1, -angle, (x1 + x2) / 2, (y1 + y2) / 2)
            x2r, y2r = rotate_point(x2, y1, -angle, (x1 + x2) / 2, (y1 + y2) / 2)
            x3r, y3r = rotate_point(x2, y2, -angle, (x1 + x2) / 2, (y1 + y2) / 2)
            x4r, y4r = rotate_point(x1, y2, -angle, (x1 + x2) / 2, (y1 + y2) / 2)
            
            # Az adott mezőhöz tartozó szövegérték beállítása
            text_value = ""
            if field == "Name":
                text_value = name
            elif field == "Doc No":
                text_value = doc_no
            elif field == "Birthday":
                text_value = birthday_str
            elif field == "Expiry":
                text_value = expiry_str
            elif field == "CAN":
                text_value = can_str
            elif field == "Gender":
                text_value = gender_value
            
            # A címke hozzáadása a JSON-hoz
            label_entry = {
                "label": field,
                "text": text_value,
                "box": [
                    [int(x1r), int(y1r)],
                    [int(x2r), int(y2r)],
                    [int(x3r), int(y3r)],
                    [int(x4r), int(y4r)]
                ]
            }
            
            label_data["labels"].append(label_entry)
        
        return augmented_image, output_image_path, output_json_path, label_data
