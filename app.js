const express = require('express');
const multer = require('multer');
const axios = require('axios');
const bodyParser = require('body-parser');
const csvGenerator = require('./csvGenerator');
const ExcelJS = require('exceljs');
const AdmZip = require('adm-zip');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload', upload.any(), async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();

        for (let i = 0; i < req.files.length; i++) {
            let xmlDataArray;
            if (req.files[i].originalname.endsWith('.zip')) {
                // Descomprimir el archivo ZIP
                const zip = new AdmZip(req.files[i].buffer);
                const zipEntries = zip.getEntries();

                xmlDataArray = zipEntries.map(entry => entry.getData().toString('utf-8'));
            } else {
                xmlDataArray = [req.files[i].buffer.toString('utf-8')];
            }

            for (let j = 0; j < xmlDataArray.length; j++) {
                const xmlData = xmlDataArray[j];
                const response = await axios.post('http://dev.creativosdigitales.co:8080/basex/analizar/tabla', xmlData, {
                    headers: {
                        'Content-Type': 'application/xml',
                    },
                });

                const jsonData = response.data;

                // Generar archivo CSV
                const csvContent = await csvGenerator.generateCSV(jsonData);

                // Convertir el contenido del CSV en un array de arrays para ExcelJS
                const rows = csvContent.split('\n').map(row => row.split(','));

                // Añadir las filas a una nueva hoja de cálculo en el workbook
                const worksheet = workbook.addWorksheet(`Factura${i}_${j}`);
                worksheet.addRows(rows);
            }
        }

        // Guardar el workbook como un buffer
        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Facturas.xlsx');
        res.send(buffer);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
