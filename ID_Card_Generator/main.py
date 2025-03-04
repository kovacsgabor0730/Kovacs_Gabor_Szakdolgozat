from PIL import Image, ImageDraw, ImageFont
import random
import string
from datetime import datetime, timedelta
import json
import os

def generate_random_date(start_date, end_date):
    random_days = random.randint(0, (end_date - start_date).days)
    random_date = start_date + timedelta(days=random_days)
    year = str(random_date.year)
    month = str(random_date.month).zfill(2)
    day = str(random_date.day).zfill(2)
    return [day, month, year]

def generate_doc_no():
    digits = ''.join(random.choices(string.digits, k=6))
    letters = ''.join(random.choices(string.ascii_uppercase, k=2))
    return digits + letters

def generate_can():
    return ' '.join(random.choices(string.digits, k=6))

# Paths and fonts setup
font_path_normal = "./data/fonts/Nexa Bold.otf"  
font_path_bold = "./data/fonts/VanillaExtractRegular.ttf"  
font_size = 21
font_normal = ImageFont.truetype(font_path_normal, font_size)
font_bold = ImageFont.truetype(font_path_bold, font_size)
can_font_size = 28
font_can = ImageFont.truetype(font_path_normal, can_font_size)

# Load input files
file = open('./data/HU.csv', mode='r', encoding='utf-8')
images = open('./data/selfie_dataset.txt', mode='r', encoding='utf-8')

# Gender-based image lists
male_images = []
female_images = []
for image in images:
    line = image.strip().split(' ')
    if len(line) < 36:
        continue
    try:
        partial_faces = int(line[2])
        is_female = int(line[3])
        baby = int(line[20])
        child = int(line[22])
        teenager = int(line[23])
        black = int(line[31])
        asian = int(line[32])
        oval_face = int(line[33])
        heart_face = int(line[35])
    except ValueError:
        continue
    if (partial_faces == -1 and baby == -1 and child == -1 and teenager == -1
            and black == -1 and asian == -1 and oval_face == -1 and heart_face == -1):
        if is_female == 1:
            female_images.append(line[0])
        else:
            male_images.append(line[0])

# Position settings
name_position = (248, 97)  
doc_no_position = (485, 220)  
birthday_position = (465, 180)  
expiry_position = (465, 200)  
can_position = (280, 247)
nf_position = (300, 160)

i = 0
male_i = 0
female_i = 0

# JSON output folder
os.makedirs('./data/Generated_cards/json_labels', exist_ok=True)

# Start generating labeled cards
for person in file:
    if i == 10:
        break
    id_card = Image.open('./data/eszemelyi-front_photoshoped.png').resize((600, 378))
    id_card = id_card.convert('RGB') if id_card.mode == 'RGBA' else id_card
    id_card.save('./data/eszemelyi-front_photoshoped.jpg')
    id_card = Image.open('./data/eszemelyi-front_photoshoped.jpg')
    draw = ImageDraw.Draw(id_card)

    person = person.strip().split(',')
    name = f"{person[1]} {person[0]}".upper()
    doc_no = generate_doc_no()
    birthday = generate_random_date(datetime(1950, 1, 1), datetime(2024, 12, 31))
    expiry = [birthday[0], birthday[1], str(random.randint(int(birthday[2]) + 10, 2034))]
    birthday_str = f"{birthday[0]}   {birthday[1]}    {birthday[2]}"
    expiry_str = f"{expiry[0]}   {expiry[1]}    {expiry[2]}"
    gender = person[2].strip()
    new_photo = Image.open('./data/images/'+(female_images[female_i] if gender == "F" else male_images[male_i])+'.jpg')
    new_photo_resized = new_photo.resize((190, 270)).convert('L')
    id_card.paste(new_photo_resized, (25, 82))

    # Draw text
    draw.text(name_position, name, font=font_normal, fill="#787372")
    draw.text(doc_no_position, doc_no, font=font_normal, fill="#787372")
    draw.text(birthday_position, birthday_str, font=font_normal, fill="#787372")
    draw.text(expiry_position, expiry_str, font=font_normal, fill="#787372")
    draw.text(can_position, generate_can(), font=font_can, fill="#787372")
    if gender == "F":
        draw.text(nf_position, "N/", font=font_bold, fill="#787372")
        draw.text((nf_position[0] + 30, nf_position[1]), "F", font=font_normal, fill="#787372")
        female_i += 1
    else:
        draw.text(nf_position, "N/", font=font_normal, fill="#787372")
        draw.text((nf_position[0] + 30, nf_position[1]), "F", font=font_bold, fill="#787372")
        male_i += 1

    # Prepare JSON label data
    label_data = {
        "image": f'eszemelyi_with_{person[1]}_{person[0]}.jpg',
        "labels": [
            {"label": "Name", "box": [name_position[0], name_position[1], name_position[0] + 150, name_position[1] + 20]},
            {"label": "Doc No", "box": [doc_no_position[0], doc_no_position[1], doc_no_position[0] + 100, doc_no_position[1] + 20]},
            {"label": "Birthday", "box": [birthday_position[0], birthday_position[1], birthday_position[0] + 100, birthday_position[1] + 20]},
            {"label": "Expiry", "box": [expiry_position[0], expiry_position[1], expiry_position[0] + 100, expiry_position[1] + 20]},
            {"label": "CAN", "box": [can_position[0], can_position[1], can_position[0] + 60, can_position[1] + 20]},
            {"label": "Gender", "box": [nf_position[0], nf_position[1], nf_position[0] + 30, nf_position[1] + 20]}
        ]
    }
    for label in label_data["labels"]:
        box = label["box"]
        draw.rectangle([box[0], box[1], box[2], box[3]], outline="red", width=2)
        draw.text((box[0], box[1] - 10), label["label"], font=font_normal, fill="red")

    # Save labeled image and JSON
    output_image_path = f'./data/Generated_cards/eszemelyi_with_{person[1]}_{person[0]}.jpg'
    output_json_path = f'./data/Generated_cards/json_labels/{person[1]}_{person[0]}.json'
    id_card.save(output_image_path)
    with open(output_json_path, 'w') as json_file:
        json.dump(label_data, json_file, indent=4)

    print(f'Mentett kép: {output_image_path}')
    print(f'Mentett címke fájl: {output_json_path}')
    i+=1

file.close()
