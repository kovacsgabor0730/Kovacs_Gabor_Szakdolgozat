from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Conv2D, MaxPooling2D, Flatten, Dense

def create_model(input_shape, num_outputs):
    inputs = Input(shape=input_shape)

    # Convolutional layers
    x = Conv2D(32, (3, 3), activation='relu', padding='same')(inputs)
    x = MaxPooling2D((2, 2))(x)

    x = Conv2D(64, (3, 3), activation='relu', padding='same')(x)
    x = MaxPooling2D((2, 2))(x)

    x = Conv2D(128, (3, 3), activation='relu', padding='same')(x)
    x = MaxPooling2D((2, 2))(x)

    x = Flatten()(x)
    x = Dense(512, activation='relu')(x)

    # Bounding box output (6 fields, each with 8 values - 4 points x,y)
    outputs = Dense(num_outputs, activation='sigmoid')(x)

    model = Model(inputs=inputs, outputs=outputs)
    return model

# Test run
if __name__ == "__main__":
    IMAGE_DIR = 'data/Generated_cards'
    JSON_DIR = 'data/Generated_cards/json_labels'

    X, y = load_data(IMAGE_DIR, JSON_DIR)
    print(f"Images shape: {X.shape}")
    print(f"Bounding boxes shape: {y.shape}")

    model = create_model((IMG_HEIGHT, IMG_WIDTH, 3), BOX_OUTPUT)
    model.summary()