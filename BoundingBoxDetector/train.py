import os
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split

from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from matplotlib import pyplot as plt

# Az adatgenerátort importáljuk az új fájlból
from data_generator import BoundingBoxDataGenerator
from model import create_model

IMAGE_DIR = 'data/Generated_cards'
JSON_DIR = 'data/Generated_cards/json_labels'
IMG_HEIGHT = 378
IMG_WIDTH = 600
BOX_OUTPUT = 6 * 8
BATCH_SIZE = 8
EPOCHS = 50

def bounding_box_accuracy(y_true, y_pred):
    # Konvertáljuk mindkét tenzort float32 típusra
    y_true = tf.cast(y_true, tf.float32)
    y_pred = tf.cast(y_pred, tf.float32)
    
    tolerance = 0.03
    diff = tf.abs(y_true - y_pred)
    correct = tf.cast(diff < tolerance, tf.float32)
    return tf.reduce_mean(correct)

print("Generating file lists...")
json_files = [f for f in os.listdir(JSON_DIR) if f.endswith('.json')]
print(f"Found {len(json_files)} labeled images")

# Train-validation split a fájl nevekre
from sklearn.model_selection import train_test_split
train_files, val_files = train_test_split(json_files, test_size=0.2, random_state=42)

print(f"Training files: {len(train_files)}")
print(f"Validation files: {len(val_files)}")

# Adatgenerátorok létrehozása
train_generator = BoundingBoxDataGenerator(
    IMAGE_DIR, 
    JSON_DIR, 
    batch_size=BATCH_SIZE, 
    img_height=IMG_HEIGHT, 
    img_width=IMG_WIDTH,
    shuffle=True
)

val_generator = BoundingBoxDataGenerator(
    IMAGE_DIR, 
    JSON_DIR, 
    batch_size=BATCH_SIZE, 
    img_height=IMG_HEIGHT, 
    img_width=IMG_WIDTH,
    shuffle=False
)

# Create and compile model
print("Creating model...")
model = create_model((IMG_HEIGHT, IMG_WIDTH, 3), BOX_OUTPUT)

model.compile(
    optimizer=Adam(learning_rate=0.001),
    loss='mse',
    metrics=['mae', bounding_box_accuracy]
)

early_stopping = EarlyStopping(
    monitor='val_loss',
    patience=10,
    verbose=1,
    restore_best_weights=False,
    mode='min'
)

accuracy_checkpoint = ModelCheckpoint(
    filepath='bounding_box_detector_best_accuracy.h5',
    monitor='val_bounding_box_accuracy',
    verbose=1,
    save_best_only=True,
    mode='max'
)

loss_checkpoint = ModelCheckpoint(
    filepath='bounding_box_detector_best_loss.h5',
    monitor='val_loss',
    verbose=1,
    save_best_only=True,
    mode='min'
)

print("Starting training...")
history = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=EPOCHS,
    callbacks=[early_stopping, accuracy_checkpoint, loss_checkpoint]
)

# Az utolsó modell mentése
model.save('bounding_box_detector_final.h5')
print("Training completed.")
print("Models saved:")
print(" - Best accuracy model: bounding_box_detector_best_accuracy.h5")
print(" - Best loss model: bounding_box_detector_best_loss.h5")
print(" - Final model: bounding_box_detector_final.h5")

# Plot learning curves
plt.figure(figsize=(15, 6))

# Loss subplot
plt.subplot(1, 2, 1)
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Validation Loss')
plt.title('Loss Curves')
plt.xlabel('Epochs')
plt.ylabel('Loss (MSE)')
plt.legend()

# Accuracy subplot
plt.subplot(1, 2, 2)
plt.plot(history.history['bounding_box_accuracy'], label='Train Accuracy')
plt.plot(history.history['val_bounding_box_accuracy'], label='Validation Accuracy')
plt.title('Accuracy Curves')
plt.xlabel('Epochs')
plt.ylabel('Bounding Box Accuracy')
plt.legend()

plt.tight_layout()
plt.savefig('training_curves.png')
plt.show()