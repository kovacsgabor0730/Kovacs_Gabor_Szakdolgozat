import pytest
import json
import os
import sys
import base64

# Biztosítsuk, hogy az alkalmazás importálható legyen
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app, preprocess_image, decode_prediction, extract_structured_data

@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    """Teszteli a health végpont válaszát"""
    response = client.get('/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "status" in data
    assert "version" in data
    assert "modelLoaded" in data
    assert "memoryUsage" in data

def test_process_missing_image(client):
    """Teszteli a hiányzó kép hibakezelését"""
    response = client.post('/process', 
                          data=json.dumps({}),
                          content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['success'] == False
    assert "Missing image data" in data['error']

def test_process_invalid_request(client):
    """Teszteli a nem JSON kérés hibakezelését"""
    response = client.post('/process', 
                          data="Not a JSON",
                          content_type='text/plain')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['success'] == False

def test_process_invalid_image_data(client):
    """Teszteli az érvénytelen képadat hibakezelését"""
    response = client.post('/process', 
                         data=json.dumps({"image": "not-valid-base64"}),
                         content_type='application/json')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['success'] == False
    assert "Invalid image data" in data['error']

def test_preprocess_image():
    """Teszteli a kép előfeldolgozó funkciót"""
    # Egyszerű fekete kép tesztelése
    black_image = np.zeros((100, 100, 3), dtype=np.uint8)
    _, buffer = cv2.imencode('.jpg', black_image)
    base64_image = base64.b64encode(buffer).decode('utf-8')
    
    result = preprocess_image(base64_image, target_size=(128, 32))
    
    assert result is not None
    assert result.shape == (1, 128, 32, 3)
    assert np.max(result) <= 1.0  # Ellenőrzi a normalizálást

def test_extract_structured_data():
    """Teszteli az adatkinyerő funkciót"""
    data = extract_structured_data("Sample text")
    
    assert isinstance(data, dict)
    assert "id_number" in data
    assert "first_name" in data
    assert "last_name" in data
    assert "sex" in data
    assert "date_of_expiry" in data
    assert "place_of_birth" in data
    assert "mothers_maiden_name" in data
    assert "can_number" in data
    assert "date_of_birth" in data

def test_decode_prediction():
    """Teszteli az előrejelzés dekódoló funkciót"""
    # Mock előrejelzés
    mock_prediction = np.random.random((1, 32, 128))
    
    result = decode_prediction(mock_prediction)
    
    assert isinstance(result, dict)
    assert all(key in result for key in [
        "id_number", "first_name", "last_name", "sex", "date_of_expiry", 
        "place_of_birth", "mothers_maiden_name", "can_number", "date_of_birth"
    ])

def test_swagger_doc_endpoint(client):
    """Teszteli, hogy a Swagger UI és dokumentáció elérhető-e"""
    response = client.get('/api-docs/')
    assert response.status_code == 200
    assert b'swagger' in response.data.lower()

    response = client.get('/static/api-docs.yaml')
    assert response.status_code == 200