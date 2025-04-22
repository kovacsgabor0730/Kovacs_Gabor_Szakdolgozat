import random
import string
from datetime import datetime, timedelta

def generate_random_date(start_date, end_date):
    """
    Generál egy véletlenszerű dátumot két dátum között.
    
    Args:
        start_date (datetime): Kezdő dátum
        end_date (datetime): Végső dátum
    
    Returns:
        list: Lista [nap, hónap, év] formátumban
    """
    random_days = random.randint(0, (end_date - start_date).days)
    random_date = start_date + timedelta(days=random_days)
    year = str(random_date.year)
    month = str(random_date.month).zfill(2)
    day = str(random_date.day).zfill(2)
    return [day, month, year]


def generate_doc_no():
    """
    Generál egy véletlenszerű személyi azonosító számot.
    
    Returns:
        str: 6 számjegy + 2 nagybetű formátumú azonosító
    """
    digits = ''.join(random.choices(string.digits, k=6))
    letters = ''.join(random.choices(string.ascii_uppercase, k=2))
    return digits + letters


def generate_can():
    """
    Generál egy véletlenszerű CAN számot a személyi igazolványhoz.
    
    Returns:
        str: 6 számjegyből álló szóközökkel elválasztott formátumú szám
    """
    return ' '.join(random.choices(string.digits, k=6))
