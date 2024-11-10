import torch
from torchvision import transforms
from torch.utils.data import DataLoader
from model import FieldOCRNetwork
from dataset import create_dataset, collate_fn
from train import train_model, save_checkpoint, load_checkpoint, predict_text
from PIL import Image

# Definiáld a karakterkészletet és a mappingeket
chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
char_to_idx = {char: i + 1 for i, char in enumerate(chars)}  # 1-től kezdődő indexek, a 0 a CTC blank token lesz
idx_to_char = {i + 1: char for i, char in enumerate(chars)}
idx_to_char[0] = ""


def main():
    # Adatkészlet és DataLoader beállítása
    dataset = create_dataset(char_to_idx)
    train_loader = DataLoader(dataset, batch_size=32, shuffle=True, collate_fn=collate_fn)
    num_chars = len(char_to_idx) + 1
    model = FieldOCRNetwork(num_chars=num_chars, max_text_length=32)
    criterion = torch.nn.CTCLoss(blank=0)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.5)

    # Válaszd ki, hogy edzeni vagy betölteni szeretnéd-e a modellt
    choice = input("Válaszd ki a műveletet (train/load/predict): ").strip().lower()

    if choice == "train":
        print("Modell edzése...")
        train_model(model, train_loader, criterion, optimizer, scheduler, num_epochs=10)
        save_checkpoint(model, optimizer, epoch=10)  # A végső modell mentése
        print("A modell betanítása kész és elmentve!")

    elif choice == "load":
        print("Modell betöltése...")
        load_checkpoint(model, optimizer)
        print("A modell sikeresen betöltve!")

    elif choice == "predict":
        print("Betöltött modell alapján szöveg előrejelzése egy képből.")
        image_path = input("Add meg a kép elérési útját: ").strip()

        # Kép betöltése
        image = Image.open(image_path).convert('RGB')

        # Szöveg előrejelzése
        predicted_text = predict_text(model, image, char_to_idx, idx_to_char)
        print(f"A képen található szöveg: {predicted_text}")

    else:
        print("Érvénytelen választás! Válaszd a 'train', 'load' vagy 'predict' lehetőséget.")


if __name__ == "__main__":
    main()
