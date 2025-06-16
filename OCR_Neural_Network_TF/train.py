import os
import json
import cv2
from tqdm import tqdm
import numpy as np
import tensorflow as tf
import unicodedata
import re
import matplotlib.pyplot as plt

from keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau, TensorBoard
from mltu.preprocessors import ImageReader
from mltu.transformers import ImageResizer, LabelIndexer, LabelPadding
from mltu.dataProvider import DataProvider
from mltu.losses import CTCloss
from mltu.callbacks import Model2onnx, TrainLogger
from mltu.metrics import CWERMetric

from model import train_model
from configs import ModelConfigs

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Define paths relative to the script directory
DATA_PATH = os.path.join(SCRIPT_DIR, "data", "Generated_cards")
JSON_DIR = os.path.join(DATA_PATH, "json_labels")
FIELDS_DIR = os.path.join(DATA_PATH, "fields")


def read_annotation_file(annotation_path, vocab):
    dataset, max_len = [], 0
    with open(annotation_path, "r", encoding="utf-8") as f:  # Explicit UTF-8 encoding
        for line in tqdm(f.readlines()):
            try:
                image_path, label = line.strip().split('\t')
                full_image_path = os.path.join(DATA_PATH, image_path[1:])
                dataset.append([full_image_path, label])
                vocab.update(label)  # Add all characters in the label to the vocab set
                max_len = max(max_len, len(label))
            except ValueError as e:
                print(f"Error parsing line: {line.strip()} - {str(e)}")
                continue
    return dataset, max_len


def sanitize_filename(filename):
    filename = unicodedata.normalize('NFKD', filename)
    filename = ''.join([c for c in filename if not unicodedata.combining(c)])
    filename = filename.replace(' ', '_')
    filename = re.sub(r'[^a-zA-Z0-9_.-]', '', filename)
    return filename


def sanitize_label(label, vocab):
    """Ensure that all characters in the label are valid."""
    return ''.join([char for char in label if char in vocab])


configs = ModelConfigs()

# Setup paths
train_annotation_path = os.path.join(DATA_PATH, "annotation_train.txt")
val_annotation_path = os.path.join(DATA_PATH, "annotation_val.txt")

# Initialize the vocab as a set to ensure uniqueness
train_vocab = set()

# Read the training and validation datasets, and build the vocab
train_dataset, max_train_len = read_annotation_file(train_annotation_path, train_vocab)
val_dataset, max_val_len = read_annotation_file(val_annotation_path, train_vocab)

# Sort and save vocab to configs
configs.vocab = "".join(sorted(train_vocab))
configs.max_text_length = max(max_train_len, max_val_len)
configs.save()

# Data providers
train_data_provider = DataProvider(
    dataset=train_dataset,
    skip_validation=True,
    batch_size=configs.batch_size,
    data_preprocessors=[ImageReader()],
    transformers=[
        ImageResizer(configs.width, configs.height),
        LabelIndexer(configs.vocab),
        LabelPadding(max_word_length=configs.max_text_length, padding_value=len(configs.vocab))
    ],
)

val_data_provider = DataProvider(
    dataset=val_dataset,
    skip_validation=True,
    batch_size=configs.batch_size,
    data_preprocessors=[ImageReader()],
    transformers=[
        ImageResizer(configs.width, configs.height),
        LabelIndexer(configs.vocab),
        LabelPadding(max_word_length=configs.max_text_length, padding_value=len(configs.vocab))
    ],
)

# Model setup
model = train_model(
    input_dim=(configs.height, configs.width, 3),
    output_dim=len(configs.vocab),
)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=configs.learning_rate),
    loss=CTCloss(),
    metrics=[CWERMetric()],
    run_eagerly=False
)
model.summary(line_length=110)

# Create directories for saving models and logs
os.makedirs(configs.model_path, exist_ok=True)

# Callbacks
earlystopper = EarlyStopping(monitor="val_CER", patience=100, verbose=1)
checkpoint = ModelCheckpoint(f"{configs.model_path}/model.h5", monitor="val_CER", verbose=1, save_best_only=True, mode="min")
trainLogger = TrainLogger(configs.model_path)
tb_callback = TensorBoard(f"{configs.model_path}/logs", update_freq=1)
reduceLROnPlat = ReduceLROnPlateau(monitor="val_CER", factor=0.9, min_delta=1e-10, patience=5, verbose=1, mode="auto")
model2onnx = Model2onnx(f"{configs.model_path}/model.h5")

# Model training
history = model.fit(
    train_data_provider,
    validation_data=val_data_provider,
    epochs=configs.train_epochs,
    callbacks=[earlystopper, checkpoint, trainLogger, reduceLROnPlat, tb_callback, model2onnx],
    workers=configs.train_workers
)

# Save datasets to CSV
train_data_provider.to_csv(os.path.join(configs.model_path, "train.csv"))
val_data_provider.to_csv(os.path.join(configs.model_path, "val.csv"))

plt.figure(figsize=(12, 8))
if 'loss' in history.history:
    plt.plot(history.history['loss'], label='Train Loss')
if 'val_loss' in history.history:
    plt.plot(history.history['val_loss'], label='Validation Loss')
if 'CWERMetric' in history.history:
    plt.plot(history.history['CWERMetric'], label='Train CER')
if 'val_CWERMetric' in history.history:
    plt.plot(history.history['val_CWERMetric'], label='Validation CER')
if 'CER' in history.history:
    plt.plot(history.history['CER'], label='Train CER')
if 'val_CER' in history.history:
    plt.plot(history.history['val_CER'], label='Validation CER')
plt.xlabel('Epoch')
plt.ylabel('Value')
plt.title('Training History')
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.savefig(os.path.join(configs.model_path, "training_history.png"))
plt.show()