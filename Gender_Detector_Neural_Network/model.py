from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.regularizers import l2
from data_loader import IMAGE_SIZE

def build_model(dropout_rate=0.5, l2_reg=0.0005):
    """
    Optimalizált CNN modell a nem osztályozásához
    """
    inputs = keras.Input(shape=(270, 190, 3))

    
    # Első konvolúciós blokk
    x = layers.Conv2D(32, (3, 3), padding='same', activation='relu', kernel_regularizer=l2(l2_reg))(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.Conv2D(32, (3, 3), padding='same', activation='relu', kernel_regularizer=l2(l2_reg))(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Dropout(0.25)(x)
    
    # Második konvolúciós blokk
    x = layers.Conv2D(64, (3, 3), padding='same', activation='relu', kernel_regularizer=l2(l2_reg))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Conv2D(64, (3, 3), padding='same', activation='relu', kernel_regularizer=l2(l2_reg))(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Dropout(0.25)(x)
    
    # Ellaposítás és fully connected rétegek
    x = layers.Flatten()(x)
    x = layers.Dense(128, activation='relu', kernel_regularizer=l2(l2_reg))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(dropout_rate)(x)
    outputs = layers.Dense(1, activation='sigmoid')(x)
    
    # Modell összeállítása
    model = keras.Model(inputs=inputs, outputs=outputs)
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.0003),
        loss='binary_crossentropy',
        metrics=['accuracy', 
                keras.metrics.Precision(name='precision'),
                keras.metrics.Recall(name='recall'),
                keras.metrics.AUC(name='auc')]
    )
    
    return model