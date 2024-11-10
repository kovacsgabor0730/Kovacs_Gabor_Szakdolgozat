import os
import json
from PIL import Image
import torch
from torch.utils.data import Dataset
from torchvision import transforms

class FieldOCRDataset(Dataset):
    def __init__(self, data_root='data/Generated_cards', transform=None, char_to_idx=None):
        self.data_root = data_root
        self.transform = transform
        self.char_to_idx = char_to_idx
        self.json_dir = os.path.join(data_root, 'json_labels')

        self.samples = []
        for json_file in os.listdir(self.json_dir):
            if json_file.endswith('.json'):
                with open(os.path.join(self.json_dir, json_file), 'r') as f:
                    label_data = json.load(f)

                    image_path = os.path.join(data_root, label_data['image'])
                    if os.path.exists(image_path):
                        for label_info in label_data['labels']:
                            self.samples.append({
                                'image_path': image_path,
                                'box': label_info['box'],
                                'label': label_info['label']
                            })

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        sample = self.samples[idx]

        image = Image.open(sample['image_path']).convert('RGB')
        box = sample['box']
        field_image = image.crop(box)

        if self.transform:
            field_image = self.transform(field_image)

        # Convert label string to a list of indices
        label_indices = [self.char_to_idx[char] for char in sample['label'] if char in self.char_to_idx]

        return field_image, torch.tensor(label_indices, dtype=torch.long)

# Collate function for variable-length labels
def collate_fn(batch):
    images, labels = zip(*batch)
    max_len = max(len(label) for label in labels)
    padded_labels = [torch.cat([label, torch.zeros(max_len - len(label), dtype=torch.long)]) for label in labels]
    return torch.stack(images), torch.stack(padded_labels)

# Dataset létrehozása
def create_dataset(char_to_idx):
    transform = transforms.Compose([
        transforms.Resize((32, 128)),
        transforms.RandomRotation(5),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
    ])
    dataset = FieldOCRDataset(
        data_root='data/Generated_cards',
        transform=transform,
        char_to_idx=char_to_idx
    )
    return dataset
