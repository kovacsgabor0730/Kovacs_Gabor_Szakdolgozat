const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/adatbazis', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const FelhasznaloSchema = new mongoose.Schema({
    nev: String,
    email: String
});

const Felhasznalo = mongoose.model('Felhasznalo', FelhasznaloSchema);

const ujFelhasznalo = new Felhasznalo({
    nev: 'Kiss Péter',
    email: 'peter.kiss@example.com'
});

ujFelhasznalo.save()
    .then(() => console.log('Felhasználó sikeresen mentve!'))
    .catch(err => console.error('Hiba történt:', err));
