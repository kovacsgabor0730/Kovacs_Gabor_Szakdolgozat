import random
from PIL import ImageEnhance
from bounding_box_utils import rotate_box

def augment_image_and_boxes(image, boxes, angle=None):
    """
    Kibővíti a képet és frissíti a befoglaló kereteket: elforgatja, változtatja a fényerőt, kontrasztot, zajt ad hozzá.
    
    Args:
        image: Az eredeti kép
        boxes: A befoglaló keretek listája
        angle: A forgatás szöge (None esetén véletlenszerű)
        
    Returns:
        tuple: Az augmentált kép, a frissített befoglaló keretek és a forgatási szög
    """
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

    # További képfeldolgozási műveletekt (fényerő, kontraszt, zaj)
    return apply_image_enhancements(augmented_image, new_boxes, angle)


def apply_image_enhancements(image, boxes, angle):
    """
    Alkalmazza a képjavításokat: fényerő, kontraszt és zaj.
    
    Args:
        image: A forgatott kép
        boxes: A frissített befoglaló keretek
        angle: A forgatási szög
        
    Returns:
        tuple: A továbbfejlesztett kép, a befoglaló keretek és a forgatási szög
    """
    # Fényerő és kontraszt módosítása
    brightness_enhancer = ImageEnhance.Brightness(image)
    contrast_enhancer = ImageEnhance.Contrast(image)
    enhanced_image = brightness_enhancer.enhance(random.uniform(0.8, 1.2))
    enhanced_image = contrast_enhancer.enhance(random.uniform(0.8, 1.2))
    
    # Zaj hozzáadása
    noise_image = enhanced_image.convert("RGB")
    pixels = noise_image.load()
    for i in range(noise_image.width):
        for j in range(noise_image.height):
            noise = random.randint(-10, 10)
            r, g, b = pixels[i, j]
            pixels[i, j] = (max(0, min(255, r + noise)),
                            max(0, min(255, g + noise)),
                            max(0, min(255, b + noise)))

    return noise_image, boxes, angle
