from PIL import Image

id_card = Image.open('./data/eszemelyi-front.jpg')
new_photo = Image.open('./data/new_photo.jpg')

new_photo_resized = new_photo.resize((190, 270))
new_photo_resized=new_photo_resized.convert('L')

# Az eredeti kép helyének koordinátái és mérete
left, top, right, bottom = 25, 82, 272, 330


id_card.paste(new_photo_resized, (left, top))


id_card.save('./data/eszemelyi_with_new_photo.jpg')


id_card.show()
