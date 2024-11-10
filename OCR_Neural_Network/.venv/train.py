import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import transforms
from model import FieldOCRNetwork
from dataset import create_dataset, collate_fn


def train_model(model, train_loader, criterion, optimizer, scheduler, num_epochs=10):
    """
    Training loop for the OCR model
    """
    model.train()
    for epoch in range(num_epochs):
        running_loss = 0.0

        for i, (images, labels) in enumerate(train_loader):
            optimizer.zero_grad()

            # Forward pass
            outputs = model(images)

            # Prepare data for CTC loss
            input_lengths = torch.full(size=(outputs.size(0),), fill_value=outputs.size(1), dtype=torch.long)
            target_lengths = torch.tensor([len(label[label != 0]) for label in labels], dtype=torch.long)

            # Calculate loss
            loss = criterion(outputs.log_softmax(2), labels, input_lengths, target_lengths)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()

            if i % 100 == 99:
                print(f'Epoch {epoch + 1}, Batch {i + 1}, Loss: {running_loss / 100:.4f}')
                running_loss = 0.0

        scheduler.step()

        # Save checkpoint
        save_checkpoint(model, optimizer, epoch)


def save_checkpoint(model, optimizer, epoch, path="model_checkpoint.pth"):
    torch.save({
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
    }, path)


def load_checkpoint(model, optimizer, path="model_checkpoint.pth"):
    checkpoint = torch.load(path)
    model.load_state_dict(checkpoint['model_state_dict'])
    optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
    return checkpoint['epoch']


# Predict text from an image
def predict_text(model, image, char_to_idx, idx_to_char):
    model.eval()
    transform = transforms.Compose([
        transforms.Resize((32, 128)),
        transforms.ToTensor(),
    ])
    image = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(image)
        _, predicted = torch.max(outputs.squeeze(0), 1)
        text = decode_ctc(predicted, idx_to_char)
        return text

def decode_ctc(preds, idx_to_char):
    decoded = []
    for i in range(len(preds)):
        if i == 0 or preds[i] != preds[i - 1]:
            if preds[i] != 0:  # Blank class
                decoded.append(idx_to_char[preds[i].item()])
    return ''.join(decoded)


# Main function to initialize dataset and train model
if __name__ == "__main__":
    dataset = create_dataset()
    train_loader = DataLoader(dataset, batch_size=32, shuffle=True, collate_fn=collate_fn)

    num_chars = len(char_to_idx)  # Define char_to_idx based on your dataset
    model = FieldOCRNetwork(num_chars=num_chars, max_text_length=32)

    criterion = nn.CTCLoss(blank=0)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.5)

    train_model(model, train_loader, criterion, optimizer, scheduler, num_epochs=10)
