const fs = require('fs');

fs.readFile('adatok.txt', 'utf8', (err, data) => {
    if (err) {
        console.error('Hiba történt a fájl beolvasása során:', err);
        return;
    }
    console.log('Fájl tartalma:', data);
});
