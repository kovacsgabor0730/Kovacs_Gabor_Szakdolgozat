import math
from PIL import ImageDraw

def calculate_bounding_boxes(image, name, doc_no, birthday_str, expiry_str, can_str, nf_str,
                             name_position, doc_no_position, birthday_position,
                             expiry_position, can_position, nf_position, image_position,
                             font_normal, font_can):
    """
    Kiszámítja a szövegdobozok befoglaló kereteit.
    
    Args:
        image: A kép, amelyre rajzolunk
        name, doc_no, stb: A különböző szövegek
        *_position: A különböző szövegek pozíciói
        font_normal, font_can: A használt betűtípusok
        
    Returns:
        list: A befoglaló keretek listája
    """
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


def rotate_point(x, y, angle, cx, cy):
    """
    Elforgatja a pontot egy középpont körül.
    
    Args:
        x, y: A pont koordinátái
        angle: A forgatás szöge fokokban
        cx, cy: A forgatás középpontja
        
    Returns:
        tuple: Az elforgatott pont (x, y) koordinátái
    """
    angle_rad = math.radians(angle)
    x_rot = math.cos(angle_rad) * (x - cx) - math.sin(angle_rad) * (y - cy) + cx
    y_rot = math.sin(angle_rad) * (x - cx) + math.cos(angle_rad) * (y - cy) + cy
    return x_rot, y_rot


def rotate_box(box, angle, image_center):
    """
    Elforgatja a befoglaló keretet egy középpont körül.
    
    Args:
        box: A befoglaló keret (x1, y1, x2, y2) formátumban
        angle: A forgatás szöge fokokban
        image_center: A kép középpontja (x, y) formátumban
        
    Returns:
        list: Az elforgatott keret sarokpontjai
    """
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


def draw_bounding_boxes(image, bounding_boxes, angle):
    """
    Rajzolja a befoglaló kereteket a képre.
    
    Args:
        image: A kép, amelyre rajzolni kell
        bounding_boxes: A befoglaló keretek listája
        angle: A forgatás szöge
        
    Returns:
        Image: A befoglaló keretekkel ellátott kép
    """
    draw = ImageDraw.Draw(image)
    for bbox in bounding_boxes:
        x1, y1, x2, y2 = bbox

        # A befoglaló keret elforgatása a kép forgatásának megfelelően
        x1r, y1r = rotate_point(x1, y1, -angle, (x1 + x2) / 2, (y1 + y2) / 2)
        x2r, y2r = rotate_point(x2, y1, -angle, (x1 + x2) / 2, (y1 + y2) / 2)
        x3r, y3r = rotate_point(x2, y2, -angle, (x1 + x2) / 2, (y1 + y2) / 2)
        x4r, y4r = rotate_point(x1, y2, -angle, (x1 + x2) / 2, (y1 + y2) / 2)

        draw.polygon([(x1r, y1r), (x2r, y2r), (x3r, y3r), (x4r, y4r)], outline="red", width=2)
    return image
