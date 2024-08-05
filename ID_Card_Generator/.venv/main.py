
from PIL import Image, ImageDraw, ImageFont

# Betűtípus és méret meghatározása
font_path = r"C:\Windows\Fonts\times.ttf"  # Frissítsd az elérési utat szükség szerint
font_size = 21
font = ImageFont.truetype(font_path, font_size)

file = open('./data/HU.csv', mode='r', encoding='utf-8')
i=0
for person in file:
    if i==10:
        break
    id_card = Image.open('./data/eszemelyi-front.jpg')
    new_photo = Image.open('./data/new_photo.jpg')

    # Az új fotó átméretezése és szürkeárnyalatossá alakítása
    new_photo_resized = new_photo.resize((190, 270))
    new_photo_resized = new_photo_resized.convert('L')
    # Az új fotó elhelyezésének koordinátái az ID kártyán
    left, top, right, bottom = 25, 82, 272, 330
    # Az új fotó ráhelyezése az ID kártyára
    id_card.paste(new_photo_resized, (left, top))
    # ImageDraw inicializálása a rajzoláshoz
    draw = ImageDraw.Draw(id_card)
    person=person.split(',')
    text = f"{person[1]} {person[0]}".upper()
    text_position = (248, 97)  # A név koordinátái

    # Szöveg hozzáadása a képhez
    draw.text(text_position, text, font=font, fill="black")

    # Az elkészült kép mentése
    output_path = f'./data/Generated_cards/eszemelyi_with_{person[1]}_{person[0]}.jpg'
    id_card.save(output_path)

    i+=1
    print(f'Mentett kép: {output_path}')
file.close()
