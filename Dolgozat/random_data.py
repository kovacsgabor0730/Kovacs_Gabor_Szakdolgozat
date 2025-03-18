def generate_random_date(start_date, end_date):
	random_days = random.randint(0, (end_date - start_date).days)
	random_date = start_date + timedelta(days=random_days)
	year = str(random_date.year)
	month = str(random_date.month).zfill(2)
	day = str(random_date.day).zfill(2)
	return [day, month, year]
def generate_doc_no():
	digits = ''.join(random.choices(string.digits, k=6))
	letters = ''.join(random.choices(string.ascii_uppercase, k=2))
	return digits + letters
def generate_can():
	return ' '.join(random.choices(string.digits, k=6))