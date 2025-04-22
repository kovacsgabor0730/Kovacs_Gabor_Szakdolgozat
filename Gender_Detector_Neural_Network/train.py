import os
import tensorflow as tf
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
import matplotlib.pyplot as plt
from data_loader import prepare_data
from model import build_model
import numpy as np
from tensorflow.keras.preprocessing.image import ImageDataGenerator

MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

def plot_sample_images(X, y, num_samples=5):
    """Néhány minta kép megjelenítése ellenőrzés céljából"""
    plt.figure(figsize=(15, 3))
    for i in range(num_samples):
        plt.subplot(1, num_samples, i+1)
        # OpenCV BGR -> RGB konverzió a megjelenítéshez
        img = X[i] * 255  # Denormalizálás
        img = img.astype(np.uint8)
        img = img[..., ::-1]  # BGR -> RGB
        plt.imshow(img)
        plt.title(f"Nem: {'Férfi' if y[i] == 1 else 'Nő'}")
        plt.axis('off')
    plt.savefig('sample_images.png')
    plt.show()

def analyze_misclassified_samples(model, X_val, y_val, num_samples=10):
    """Elemzi és megjeleníti a tévesen osztályozott mintákat"""
    y_pred = model.predict(X_val)
    y_pred_binary = (y_pred > 0.5).astype(int)
    
    # Megtaláljuk a tévesen osztályozott mintákat
    misclassified_indices = np.where(y_pred_binary.flatten() != y_val)[0]
    
    if len(misclassified_indices) == 0:
        print("Nincs tévesen osztályozott minta!")
        return
        
    # Kiválasztunk néhány tévesen osztályozott mintát
    sample_indices = np.random.choice(misclassified_indices, 
                                      size=min(num_samples, len(misclassified_indices)), 
                                      replace=False)
    
    plt.figure(figsize=(15, 3*len(sample_indices)//5 + 3))
    for i, idx in enumerate(sample_indices):
        plt.subplot(len(sample_indices)//5 + 1, 5, i+1)
        img = X_val[idx] * 255
        img = img.astype(np.uint8)
        img = img[..., ::-1]  # BGR -> RGB
        plt.imshow(img)
        plt.title(f"Valós: {'F' if y_val[idx] == 1 else 'N'}, Becsült: {'F' if y_pred_binary[idx][0] == 1 else 'N'}\nBizonyosság: {y_pred[idx][0]:.2f}")
        plt.axis('off')
    
    plt.tight_layout()
    plt.savefig('misclassified_samples.png')
    plt.show()

def train_model(epochs=50, batch_size=32, patience=10, dropout_rate=0.5, l2_reg=0.0005):
    """
    Modell betanítása adataugmentációval és regularizációval
    
    Args:
        epochs: Maximum epoch szám
        batch_size: Batch mérete
        patience: Early stopping türelmi időszak
        dropout_rate: Dropout aránya
        l2_reg: L2 regularizáció erőssége
    """
    # Adatok betöltése
    X_train, X_val, X_test, y_train, y_val, y_test = prepare_data()
    
    if X_train is None:
        print("Hiba: Nem sikerült az adatokat betölteni.")
        return None, None
    
    # Ellenőrizzük az adatokat
    print(f"Tanító adatok: {X_train.shape}, {y_train.shape}")
    print(f"Validációs adatok: {X_val.shape}, {y_val.shape}")
    print(f"Teszt adatok: {X_test.shape}, {y_test.shape}")
    
    # Néhány minta kép megjelenítése
    plot_sample_images(X_train, y_train)
    
    # Ellenőrizzük az osztályeloszlást
    train_ratio = np.mean(y_train)
    val_ratio = np.mean(y_val)
    test_ratio = np.mean(y_test)
    print(f"Osztályeloszlás (férfi arány) - Tanító: {train_ratio:.2f}, Validációs: {val_ratio:.2f}, Teszt: {test_ratio:.2f}")
    
    # Osztálysúlyok számítása
    n_neg = len(y_train) - np.sum(y_train)
    n_pos = np.sum(y_train)
    weight_for_0 = (1 / n_neg) * (len(y_train) / 2.0) 
    weight_for_1 = (1 / n_pos) * (len(y_train) / 2.0)
    class_weight = {0: weight_for_0, 1: weight_for_1}
    
    print(f"Osztálysúlyok: {class_weight}")
    
    # Erőteljesebb adataugmentáció beállítása
    datagen = ImageDataGenerator(
        rotation_range=30,           # Erősebb forgatás
        width_shift_range=0.2,       # Nagyobb horizontális eltolás
        height_shift_range=0.2,      # Nagyobb vertikális eltolás
        shear_range=0.15,            # Nyírás
        zoom_range=0.15,             # Nagyítás/kicsinyítés
        horizontal_flip=True,        # Vízszintes tükrözés
        brightness_range=[0.8, 1.2], # Fényerő változtatás
        fill_mode='nearest'
    )
    
    # Modell létrehozása
    model = build_model(dropout_rate=dropout_rate, l2_reg=l2_reg)
    model.summary()
    
    # Tanulási ráta ütemező
    lr_scheduler = tf.keras.callbacks.LearningRateScheduler(
        lambda epoch: 0.001 * 0.9**epoch
    )
    
    # Callbacks beállítása
    callbacks = [
        # Early stopping
        EarlyStopping(
            monitor='val_loss',
            patience=patience,
            restore_best_weights=True,
            verbose=1
        ),
        # Modell mentés
        ModelCheckpoint(
            filepath=os.path.join(MODEL_DIR, 'best_model.h5'),
            monitor='val_loss',  # Érdemes veszteségre optimalizálni
            save_best_only=True,
            verbose=1
        ),
        # Tanulási ráta csökkentése
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.2,
            patience=3,
            min_lr=0.00001,
            verbose=1
        ),
        # Tanulási ráta ütemező
        lr_scheduler
    ]
    
    # Modell tanítása augmentációval
    history = model.fit(
        datagen.flow(X_train, y_train, batch_size=batch_size),
        validation_data=(X_val, y_val),
        epochs=epochs,
        steps_per_epoch=len(X_train) // batch_size,
        callbacks=callbacks,
        class_weight=class_weight,  # Osztálysúlyok alkalmazása
        verbose=1
    )
    
    # Modell értékelése
    test_loss, test_acc, precision, recall, auc = model.evaluate(X_test, y_test)
    print(f"\nTeszt metrikák:")
    print(f"Pontosság (Accuracy): {test_acc:.4f}")
    print(f"Veszteség (Loss): {test_loss:.4f}")
    print(f"Precizitás (Precision): {precision:.4f}")
    print(f"Visszahívás (Recall): {recall:.4f}")
    print(f"AUC: {auc:.4f}")
    
    # Tévesen osztályozott minták elemzése
    analyze_misclassified_samples(model, X_val, y_val, num_samples=15)
    
    # Végleges modell mentése
    model.save(os.path.join(MODEL_DIR, "gender_classification_model.h5"))
    
    return model, history

if __name__ == "__main__":
    print("Gender Detector Neural Network betanítása...")
    print("=" * 50)
    
    model, history = train_model(epochs=50, batch_size=32, patience=10)
    
    if history is not None:
        plt.figure(figsize=(12, 5))
        
        # Pontosság ábrázolása
        plt.subplot(1, 2, 1)
        plt.plot(history.history['accuracy'], label='train_accuracy')
        plt.plot(history.history['val_accuracy'], label='val_accuracy')
        plt.title('Pontosság (Accuracy)')
        plt.ylabel('Pontosság')
        plt.xlabel('Epoch')
        plt.legend()
        
        # Veszteség ábrázolása
        plt.subplot(1, 2, 2)
        plt.plot(history.history['loss'], label='train_loss')
        plt.plot(history.history['val_loss'], label='val_loss')
        plt.title('Veszteség (Loss)')
        plt.ylabel('Veszteség')
        plt.xlabel('Epoch')
        plt.legend()
        
        plt.tight_layout()
        plt.savefig('training_history.png')
        plt.show()
        
        # További metrikák ábrázolása
        if 'precision' in history.history:
            plt.figure(figsize=(12, 5))
            
            plt.subplot(1, 2, 1)
            plt.plot(history.history['precision'], label='Precision')
            plt.plot(history.history['recall'], label='Recall')
            plt.title('Precision és Recall')
            plt.ylabel('Érték')
            plt.xlabel('Epoch')
            plt.legend()
            
            plt.subplot(1, 2, 2)
            plt.plot(history.history['auc'], label='AUC')
            plt.title('AUC (Area Under the Curve)')
            plt.ylabel('AUC')
            plt.xlabel('Epoch')
            plt.legend()
            
            plt.tight_layout()
            plt.savefig('training_metrics.png')
            plt.show()
    
    print("=" * 50)
    print("Betanítás befejezve!")