const express = require('express');
const { engine } = require('express-handlebars');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.engine('hbs', engine({ extname: '.hbs', defaultLayout: 'dashboard', layoutsDir: path.join(__dirname, 'views',) }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/convert', async (req, res) => {
  const { url, options } = req.body;

  if (!url || !options) {
    return res.status(400).send('URL ve seçenekler gereklidir');
  }

  let fileExtension, fileName;
  if (options === '1') {
    fileExtension = 'mp3';
    fileName = 'downloaded-file.mp3';
  } else if (options === '2') {
    fileExtension = 'mp4';
    fileName = 'downloaded-file.mp4';
  } else {
    return res.status(400).send('Geçersiz seçenek');
  }

  try {
    const filePath = path.join(__dirname, fileName);

    if (options === '1') {
      // MP3 indirme

      // Önce videoyu indirin ve bir geçici dosyaya kaydedin
      const videoStream = ytdl(url, { filter: 'audioonly' });
      const tempFilePath = path.join(__dirname, 'temp.mp4');
      const tempFileStream = fs.createWriteStream(tempFilePath);

      videoStream.pipe(tempFileStream);

      videoStream.on('end', () => {
        // Geçici dosyayı MP3'e dönüştürün
        ffmpeg(tempFilePath)
          .toFormat('mp3')
          .on('error', (err) => {
            console.error('MP3 kodlama hatası:', err);
            res.status(500).send('Dosya indirme başarısız');
            // Geçici dosyayı silin
            fs.unlinkSync(tempFilePath);
          })
          .on('end', () => {
            console.log('MP3 dosyası başarıyla indirildi.');
            res.download(filePath, fileName, (err) => {
              if (err) {
                console.error('Dosya indirme hatası:', err);
                res.status(500).send('Dosya indirme başarısız');
              }
              // Geçici dosyayı silin
              fs.unlinkSync(tempFilePath);
            });
          })
          .pipe(fs.createWriteStream(filePath));
      });

      videoStream.on('error', (err) => {
        console.error('MP3 indirme hatası:', err);
        res.status(500).send('Dosya indirme başarısız');
        // Geçici dosyayı silin
        fs.unlinkSync(tempFilePath);
      });

    } else {
      // MP4 indirme
      ytdl(url)
        .on('error', (err) => {
          console.error('MP4 indirme hatası:', err);
          res.status(500).send('Dosya indirme başarısız');
        })
        .on('end', () => {
          console.log('MP4 dosyası başarıyla indirildi.');
          res.download(filePath, fileName, (err) => {
            if (err) {
              console.error('Dosya indirme hatası:', err);
              res.status(500).send('Dosya indirme başarısız');
            }
          });
        })
        .pipe(fs.createWriteStream(filePath));
    }
  } catch (error) {
    console.error('Genel hata:', error);
    res.status(500).send('Dosya indirme başarısız');
  }
});

app.get('/', (req, res) => {
  res.render('home');
});

app.listen(port, () => {
  console.log(`Sunucu ${port} portunda çalışıyor`);
});