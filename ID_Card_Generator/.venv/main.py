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


font_path_normal = r"C:\Windows\Fonts\times.ttf"  # Normál betűtípus
font_path_bold = r"C:\Windows\Fonts\timesbd.ttf"  # Félkövér betűtípus
font_size = 21
font_normal = ImageFont.truetype(font_path_normal, font_size)
font_bold = ImageFont.truetype(font_path_bold, font_size)

# Új betűtípus létrehozása a CAN számára, nagyobb mérettel
can_font_size = 28
font_can = ImageFont.truetype(font_path_normal, can_font_size)

file = open('./data/HU.csv', mode='r', encoding='utf-8')
i = 0

name_position = (248, 97)  # A név koordinátái
doc_no_position = (485, 220)  # A dokumentumszám koordinátái
birthday_position = (465, 180)  # A születési dátum koordinátái
expiry_position = (465, 200)  # A lejárati dátum koordinátái
can_position = (280, 247)
nf_position = (300, 160)  # A N/F szöveg koordinátái

for person in file:
    if i == 10:
        break
    id_card = Image.open('./data/eszemelyi-front.jpg')
    new_photo = Image.open('./data/new_photo.jpg')

    new_photo_resized = new_photo.resize((190, 270))
    new_photo_resized = new_photo_resized.convert('L')

    left, top, right, bottom = 25, 82, 272, 330
    id_card.paste(new_photo_resized, (left, top))

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
    if gender == "F":
        draw.text(nf_position, "N/", font=font_bold, fill="black")
        draw.text((nf_position[0] + 30, nf_position[1]), "F", font=font_normal, fill="black")
    else:
        draw.text(nf_position, "N/", font=font_normal, fill="black")
        draw.text((nf_position[0] + 30, nf_position[1]), "F", font=font_bold, fill="black")

    # Szöveg hozzáadása a képhez
    draw.text(name_position, name, font=font_normal, fill="black")
    draw.text(doc_no_position, doc_no, font=font_normal, fill="black")
    draw.text(birthday_position, birthday_str, font=font_normal, fill="black")
    draw.text(expiry_position, expiry_str, font=font_normal, fill="black")

    # CAN szöveg hozzáadása nagyobb betűmérettel
    draw.text(can_position, generate_can(), font=font_can, fill="black")

    output_path = f'./data/Generated_cards/eszemelyi_with_{person[1]}_{person[0]}.jpg'
    id_card.save(output_path)

    i += 1
    print(f'Mentett kép: {output_path}')

file.close()
