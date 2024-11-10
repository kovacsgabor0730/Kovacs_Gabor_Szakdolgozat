import torch
import torch.nn as nn
import torch.nn.functional as F


class FieldOCRNetwork(nn.Module):
    def __init__(self, num_chars, max_text_length):
        super(FieldOCRNetwork, self).__init__()

        # CNN feature extractor
        self.conv1 = nn.Conv2d(3, 32, 3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.conv3 = nn.Conv2d(64, 128, 3, padding=1)
        self.conv4 = nn.Conv2d(128, 256, 3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.dropout = nn.Dropout(0.25)

        # Bidirectional LSTM for sequence modeling
        self.lstm = nn.LSTM(512, 256, bidirectional=True, batch_first=True)

        # Output layer
        self.fc = nn.Linear(512, num_chars)

    def forward(self, x):
        # CNN layers
        x = F.relu(self.conv1(x))
        x = self.pool(x)
        x = self.dropout(x)

        x = F.relu(self.conv2(x))
        x = self.pool(x)
        x = self.dropout(x)

        x = F.relu(self.conv3(x))
        x = self.pool(x)
        x = self.dropout(x)

        x = F.relu(self.conv4(x))
        x = self.pool(x)
        x = self.dropout(x)

        # Reshape for LSTM
        batch_size, channels, height, width = x.size()
        x = x.permute(0, 3, 1, 2)
        x = x.reshape(batch_size, width, channels * height)

        # LSTM layers
        x, _ = self.lstm(x)

        # Output layer
        x = self.fc(x)

        return x
