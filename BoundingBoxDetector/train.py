import os
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split

from tensorflow.keras.optimizers import Adam
from matplotlib import pyplot as plt

from data_loader import load_data
from model import create_model

IMAGE_DIR = 'data/Generated_cards'
JSON_DIR = 'data/Generated_cards/json_labels'
IMG_HEIGHT = 378
IMG_WIDTH = 600
BOX_OUTPUT = 6 * 8
BATCH_SIZE = 8
EPOCHS = 10

def bounding_box_accuracy(y_true, y_pred):

    tolerance = 0.03
    diff = tf.abs(y_true - y_pred)
    correct = tf.cast(diff < tolerance, tf.float32)
    return tf.reduce_mean(correct)

# Load data
print("Loading data...")
X, y = load_data(IMAGE_DIR, JSON_DIR)
print(f"Image shape: {X.shape}, Bounding box shape: {y.shape}")

# Train-validation split
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

# Create and compile model
print("Creating model...")
model = create_model((IMG_HEIGHT, IMG_WIDTH, 3), BOX_OUTPUT)

model.compile(
    optimizer=Adam(learning_rate=0.001),
    loss='mse',
    metrics=['mae', bounding_box_accuracy]
)

print("Starting training...")
history = model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    batch_size=BATCH_SIZE,
    epochs=EPOCHS
)

model.save('bounding_box_detector.h5')
print("Model saved: bounding_box_detector.h5")

# Plot learning curves
plt.figure(figsize=(10, 5))
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Validation Loss')
plt.plot(history.history['bounding_box_accuracy'], label='Train Accuracy')
plt.plot(history.history['val_bounding_box_accuracy'], label='Validation Accuracy')
plt.title('Loss and Accuracy Curves')
plt.xlabel('Epochs')
plt.ylabel('Value')
plt.legend()
plt.show()