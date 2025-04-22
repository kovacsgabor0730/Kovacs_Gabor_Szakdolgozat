import json
import random
from PIL import Image
from id_card_generator import IDCardGenerator

def load_person_data(filepath):
    """
    Betölti a személyi adatokat tartalmazó fájlt.
    
    Args:
        filepath: A fájl elérési útvonala
        
    Returns:
        list: A személyi adatok listája
    """
    with open(filepath, mode='r', encoding='utf-8') as file:
        return [line.strip().split(',') for line in file]

def load_image_data(filepath):
    """
    Betölti a képadatokat tartalmazó fájlt és szétválogatja őket nem szerint.
    
    Args:
        filepath: A fájl elérési útvonala
        
    Returns:
        tuple: A férfi és női képek listája
    """
    male_images = []
    female_images = []
    
    with open(filepath, mode='r', encoding='utf-8') as images:
        for image in images:
            line = image.strip().split(' ')
            if len(line) < 36:
                continue
                
            try:
                partial_faces = int(line[2])
                is_female = int(line[3])
            except ValueError:
                continue
                
            if partial_faces == -1:
                if is_female == 1:
                    female_images.append(line[0])
                else:
                    male_images.append(line[0])
    
    return male_images, female_images

def main():
    """
    Fő program: személyi igazolványok generálása adatok és képek alapján.
    """
    # Adatok betöltése
    persons = load_person_data('./data/HU.csv')
    male_images, female_images = load_image_data('./data/selfie_dataset.txt')
    
    # Generátor létrehozása
    id_generator = IDCardGenerator()
    
    # Személyi igazolványok generálása (példán 12000 darab)
    male_i = 0
    female_i = 0
    
    for i, person in enumerate(persons[:12000]):
        # Személy adatok feldolgozása
        first_name = person[1].strip()
        last_name = person[0].strip()
        gender = person[2].strip()
        
        # Kép kiválasztása nem szerint
        if gender == "F":
            photo_path = './data/images/' + female_images[female_i] + '.jpg'
            female_i += 1
        else:
            photo_path = './data/images/' + male_images[male_i] + '.jpg'
            male_i += 1
        
        # Személyi igazolvány generálása
        augmented_image, output_image_path, output_json_path, label_data = id_generator.generate_id_card(
            [first_name, last_name, gender], photo_path
        )
        
        # Eredmények mentése
        augmented_image.save(output_image_path)
        with open(output_json_path, 'w') as json_file:
            json.dump(label_data, json_file, indent=4)
        
        print(f'Mentett kép: {output_image_path}')
        print(f'Mentett címke fájl: {output_json_path}')

if __name__ == "__main__":
    main()