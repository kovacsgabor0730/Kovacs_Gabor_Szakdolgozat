from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import math
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


def calculate_bounding_boxes(image, name, doc_no, birthday_str, expiry_str, can_str, nf_str,
                             name_position, doc_no_position, birthday_position,
                             expiry_position, can_position, nf_position, image_position,
                             font_normal, font_can):
    draw = ImageDraw.Draw(image)
    bounding_boxes = [
        draw.textbbox(name_position, name, font=font_normal),
        draw.textbbox(doc_no_position, doc_no, font=font_normal),
        draw.textbbox(birthday_position, birthday_str, font=font_normal),
        draw.textbbox(expiry_position, expiry_str, font=font_normal),
        draw.textbbox(can_position, can_str, font=font_can),
        draw.textbbox((nf_position[0], nf_position[1]), nf_str, font_can),
        image_position
    ]
    return bounding_boxes


def rotate_box(box, angle, image_center):
    cx, cy = image_center
    radians = math.radians(-angle)

    corners = [
        (box[0], box[1]),  # Top-left
        (box[2], box[1]),  # Top-right
        (box[2], box[3]),  # Bottom-right
        (box[0], box[3])  # Bottom-left
    ]

    rotated_corners = []
    for x, y in corners:
        tx, ty = x - cx, y - cy

        rx = tx * math.cos(radians) - ty * math.sin(radians)
        ry = tx * math.sin(radians) + ty * math.cos(radians)

        new_x, new_y = rx + cx, ry + cy
        rotated_corners.append((new_x, new_y))

    return rotated_corners


def augment_image_and_boxes(image, boxes, angle=None):
    if angle is None:
        angle = random.uniform(-20, 20)

    augmented_image = image.rotate(angle, expand=True)

    original_width, original_height = image.size
    new_width, new_height = augmented_image.size
    x_offset = (new_width - original_width) / 2
    y_offset = (new_height - original_height) / 2

    image_center = (original_width / 2, original_height / 2)

    new_boxes = []
    for box in boxes:
        rotated_corners = rotate_box(box, angle, image_center)
        shifted_corners = [(int(x + x_offset), int(y + y_offset)) for x, y in rotated_corners]

        xs = [corner[0] for corner in shifted_corners]
        ys = [corner[1] for corner in shifted_corners]
        new_box = (min(xs), min(ys), max(xs), max(ys))
        new_boxes.append(new_box)

    # Apply additional augmentations (brightness, contrast, noise)
    brightness_enhancer = ImageEnhance.Brightness(augmented_image)
    contrast_enhancer = ImageEnhance.Contrast(augmented_image)
    enhanced_image = brightness_enhancer.enhance(random.uniform(0.8, 1.2))
    enhanced_image = contrast_enhancer.enhance(random.uniform(0.8, 1.2))

    noise_image = enhanced_image.convert("RGB")
    pixels = noise_image.load()
    for i in range(noise_image.width):
        for j in range(noise_image.height):
            noise = random.randint(-10, 10)
            r, g, b = pixels[i, j]
            pixels[i, j] = (max(0, min(255, r + noise)),
                            max(0, min(255, g + noise)),
                            max(0, min(255, b + noise)))

    return noise_image, new_boxes, angle


def draw_bounding_boxes(image, bounding_boxes, angle):
    draw = ImageDraw.Draw(image)
    for bbox in bounding_boxes:
        x1, y1, x2, y2 = bbox

        # Rotate the bounding box in the same direction as the image
        x1r, y1r = rotate_point(x1, y1, -angle, (x1 + x2) / 2, (y1 + y2) / 2)
        x2r, y2r = rotate_point(x2, y1, -angle, (x1 + x2) / 2, (y1 + y2) / 2)
        x3r, y3r = rotate_point(x2, y2, -angle, (x1 + x2) / 2, (y1 + y2) / 2)
        x4r, y4r = rotate_point(x1, y2, -angle, (x1 + x2) / 2, (y1 + y2) / 2)

        draw.polygon([(x1r, y1r), (x2r, y2r), (x3r, y3r), (x4r, y4r)], outline="red", width=2)
    return image


def rotate_point(x, y, angle, cx, cy):
    angle_rad = math.radians(angle)
    x_rot = math.cos(angle_rad) * (x - cx) - math.sin(angle_rad) * (y - cy) + cx
    y_rot = math.sin(angle_rad) * (x - cx) + math.cos(angle_rad) * (y - cy) + cy
    return x_rot, y_rot


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
    except ValueError:
        continue
    if partial_faces == -1:
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
image_position = (25, 82, 215, 352)

i = 0
male_i = 0
female_i = 0

# JSON output folder
os.makedirs('./data/Generated_cards/json_labels', exist_ok=True)

# Start generating labeled cards
for person in file:
    if i == 5:
        break
    id_card = Image.open('./data/eszemelyi-front_photoshoped.png').resize((600, 378))
    draw = ImageDraw.Draw(id_card)

    person = person.strip().split(',')
    name = f"{person[1]} {person[0]}".upper()
    doc_no = generate_doc_no()
    birthday = generate_random_date(datetime(1950, 1, 1), datetime(2024, 12, 31))
    expiry = [birthday[0], birthday[1], str(random.randint(int(birthday[2]) + 10, 2034))]
    birthday_str = f"{birthday[0]}   {birthday[1]}    {birthday[2]}"
    expiry_str = f"{expiry[0]}   {expiry[1]}    {expiry[2]}"
    gender = person[2].strip()
    new_photo = Image.open(
        './data/images/' + (female_images[female_i] if gender == "F" else male_images[male_i]) + '.jpg')
    new_photo_resized = new_photo.resize((190, 270)).convert('L')
    id_card.paste(new_photo_resized, image_position)

    # Draw text
    draw.text(name_position, name, font=font_normal, fill="#787372")
    draw.text(doc_no_position, doc_no, font=font_normal, fill="#787372")
    draw.text(birthday_position, birthday_str, font=font_normal, fill="#787372")
    draw.text(expiry_position, expiry_str, font=font_normal, fill="#787372")

    can_str = generate_can()
    draw.text(can_position, can_str, font=font_can, fill="#787372")

    if gender == "F":
        draw.text(nf_position, "N/", font=font_bold, fill="#787372")
        draw.text((nf_position[0] + 30, nf_position[1]), "F", font=font_normal, fill="#787372")
        female_i += 1
    else:
        draw.text(nf_position, "N/", font=font_normal, fill="#787372")
        draw.text((nf_position[0] + 30, nf_position[1]), "F", font=font_bold, fill="#787372")
        male_i += 1

    # Calculate bounding boxes
    bounding_boxes = calculate_bounding_boxes(
        id_card, name, doc_no, birthday_str, expiry_str, can_str, "N/F",
        name_position, doc_no_position, birthday_position,
        expiry_position, can_position, nf_position, image_position,
        font_normal, font_can
    )

    # Perform augmentation
    augmented_image, augmented_boxes, angle = augment_image_and_boxes(id_card, bounding_boxes)

    augmented_image_with_boxes = draw_bounding_boxes(augmented_image, augmented_boxes, angle)

    if augmented_image.mode == "RGBA":
        augmented_image = augmented_image.convert("RGB")

    # Prepare JSON label data
    label_data = {
        "image": f'eszemelyi_with_{person[1]}_{person[0]}.jpg',
        "labels": []
    }

    for idx, field in enumerate(["Name", "Doc No", "Birthday", "Expiry", "CAN", "Gender", "Image"]):
        box = augmented_boxes[idx]
        x1, y1, x2, y2 = box

        x1r, y1r = rotate_point(x1, y1, -angle, (x1 + x2) / 2, (y1 + y2) / 2)
        x2r, y2r = rotate_point(x2, y1, -angle, (x1 + x2) / 2, (y1 + y2) / 2)
        x3r, y3r = rotate_point(x2, y2, -angle, (x1 + x2) / 2, (y1 + y2) / 2)
        x4r, y4r = rotate_point(x1, y2, -angle, (x1 + x2) / 2, (y1 + y2) / 2)

        text_value = ""
        bold_index = None

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
            text_value = "F" if gender=="M" else "N"

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

    output_image_path = f'./data/Generated_cards/eszemelyi_with_{person[1]}_{person[0]}.jpg'
    output_json_path = f'./data/Generated_cards/json_labels/{person[1]}_{person[0]}.json'
    augmented_image.save(output_image_path)
    with open(output_json_path, 'w') as json_file:
        json.dump(label_data, json_file, indent=4)

    print(f'Mentett kép: {output_image_path}')
    print(f'Mentett címke fájl: {output_json_path}')
    i += 1

file.close()
images.close()