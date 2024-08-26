const express = require('express');
const { engine } = require('express-handlebars');
const multer = require('multer');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

const app=express();
const port=3000;

app.engine('hbs', engine({ extname: '.hbs', defaultLayout: 'dashboard', layoutsDir: path.join(__dirname, 'views',) }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.post('/convert', async (req, res) => {
    const { url, options } = req.body;

    if (!url || !options) {
        return res.status(400).send('URL and options are required');
    }

    let fileExtension, fileName;
    if (options === '1') {
        fileExtension = 'mp3';
        fileName = 'downloaded-file.mp3';
    } else if (options === '2') {
        fileExtension = 'mp4';
        fileName = 'downloaded-file.mp4';
    } else {
        return res.status(400).send('Invalid option');
    }

    try {
        // Dosyayı indirin
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const filePath = path.join(__dirname, fileName);
        const fileStream = fs.createWriteStream(filePath);

        response.body.pipe(fileStream);
        res.render('home');
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to download file');
    }
});


app.get('/',(req,res) => {
res.render('home');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});