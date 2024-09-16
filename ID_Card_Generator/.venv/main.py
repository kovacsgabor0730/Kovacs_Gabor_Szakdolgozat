from PIL import Image, ImageDraw, ImageFont
import random
import string
from datetime import datetime, timedelta


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


font_path_normal = "./data/fonts/Nexa Bold.otf"  # Normál betűtípus
font_path_bold = "./data/fonts/VanillaExtractRegular.ttf"  # Félkövér betűtípus
font_size = 21
font_normal = ImageFont.truetype(font_path_normal, font_size)
font_bold = ImageFont.truetype(font_path_bold, font_size)

# Új betűtípus létrehozása a CAN számára, nagyobb mérettel
can_font_size = 28
font_can = ImageFont.truetype(font_path_normal, can_font_size)

file = open('./data/HU.csv', mode='r', encoding='utf-8')
images = open('./data/selfie_dataset.txt', mode='r', encoding='utf-8')

male_images = []
female_images = []

for image in images:
    # Split line into components and skip any empty or invalid lines
    line = image.strip().split(' ')
    if len(line) < 36:  # Ensure there are enough elements in the line
        continue

    # Convert relevant elements to integers for comparison
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
        continue  # Skip lines with invalid data

    # Check the specified conditions
    if (partial_faces == -1 and baby == -1 and child == -1 and teenager == -1
            and black == -1 and asian == -1 and oval_face == -1 and heart_face == -1):

        # Add image to the appropriate list based on gender
        if is_female == 1:
            female_images.append(line[0])
        else:
            male_images.append(line[0])

# Initialize counters (although these are not used anywhere in the code provided)
i = 0
male_i = 0
female_i = 0

name_position = (248, 97)  # A név koordinátái
doc_no_position = (485, 220)  # A dokumentumszám koordinátái
birthday_position = (465, 180)  # A születési dátum koordinátái
expiry_position = (465, 200)  # A lejárati dátum koordinátái
can_position = (280, 247)
nf_position = (300, 160)  # A N/F szöveg koordinátái

for person in file:
    if i == 10:
        break
    id_card = Image.open('./data/eszemelyi-front_photoshoped.png')

    # Átméretezés
    id_card = id_card.resize((600, 378))

    # Ha a kép RGBA módban van, konvertáljuk RGB-re, hogy elkerüljük a JPEG mentési hibát
    if id_card.mode == 'RGBA':
        id_card = id_card.convert('RGB')

    # Mentés JPEG formátumban
    id_card.save('./data/eszemelyi-front_photoshoped.jpg')

    # JPEG kép újbóli megnyitása
    id_card = Image.open('./data/eszemelyi-front_photoshoped.jpg')

    draw = ImageDraw.Draw(id_card)
    person = person.split(',')
    name = f"{person[1]} {person[0]}".upper()
    doc_no = generate_doc_no()
    birthday = generate_random_date(datetime(1950, 1, 1), datetime(2024, 12, 31))
    expiry = [birthday[0], birthday[1], str(random.randint(int(birthday[2]) + 10, 2034))]

    birthday_str = f"{birthday[0]}   {birthday[1]}    {birthday[2]}"
    expiry_str = f"{expiry[0]}   {expiry[1]}    {expiry[2]}"

    # N/F szöveg formázása
    gender = person[2].strip()
    # Új fotó betöltése
    if gender == "F":
        draw.text(nf_position, "N/", font=font_bold, fill="#787372")
        draw.text((nf_position[0] + 30, nf_position[1]), "F", font=font_normal, fill="#787372")
        new_photo = Image.open('./data/images/'+female_images[female_i]+'.jpg')
        female_i+=1
    else:
        draw.text(nf_position, "N/", font=font_normal, fill="#787372")
        draw.text((nf_position[0] + 30, nf_position[1]), "F", font=font_bold, fill="#787372")
        new_photo = Image.open('./data/images/'+male_images[male_i]+'.jpg')
        male_i+=1

    new_photo_resized = new_photo.resize((190, 270))
    new_photo_resized = new_photo_resized.convert('L')

    left, top, right, bottom = 25, 82, 272, 330
    id_card.paste(new_photo_resized, (left, top))
    # Szöveg hozzáadása a képhez
    draw.text(name_position, name, font=font_normal, fill="#787372")
    draw.text(doc_no_position, doc_no, font=font_normal, fill="#787372")
    draw.text(birthday_position, birthday_str, font=font_normal, fill="#787372")
    draw.text(expiry_position, expiry_str, font=font_normal, fill="#787372")

    # CAN szöveg hozzáadása nagyobb betűmérettel
    draw.text(can_position, generate_can(), font=font_can, fill="#787372")

    output_path = f'./data/Generated_cards/eszemelyi_with_{person[1]}_{person[0]}.jpg'
    id_card.save(output_path)

    i += 1
    print(f'Mentett kép: {output_path}')

file.close()
