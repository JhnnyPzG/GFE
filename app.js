const express = require('express');
const multer = require('multer');
const axios = require('axios');
const bodyParser = require('body-parser');
const csvGenerator = require('./csvGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload', upload.array('xmlFiles', 20), async (req, res) => {
    try {
        const csvBuffers = [];

        for (let i = 0; i < req.files.length; i++) {
            const xmlData = req.files[i].buffer.toString('utf-8');
            const response = await axios.post('http://dev.creativosdigitales.co:8080/basex/analizar/tabla', xmlData, {
                headers: {
                    'Content-Type': 'application/xml',
                },
            });

            const jsonData = response.data;

            // Generar archivo CSV
            const csvContent = await csvGenerator.generateCSV(jsonData);

            csvBuffers.push({
                buffer: Buffer.from(csvContent),
                filename: `Factura${i}.csv`
            });
        }

        const zip = new require('node-zip')();
        csvBuffers.forEach((file) => {
            zip.file(file.filename, file.buffer);
        });

        const zipContent = zip.generate({ type: 'nodebuffer' });

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=Factura.zip');
        res.send(zipContent);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
