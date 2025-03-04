const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Üdvözlünk a Node.js backend szerveren!');
});

app.listen(3000, () => {
    console.log('A szerver a 3000-es porton fut.');
});