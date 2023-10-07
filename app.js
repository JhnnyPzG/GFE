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
        let worksheet;

        for (let i = 0; i < req.files.length; i++) {
            let xmlDataArray;
            if (req.files[i].originalname.endsWith('.zip')) {
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

                const csvContent = await csvGenerator.generateCSV(jsonData);

                const rows = csvContent.split('\n').map(row => row.split(','));

                if (!worksheet) { // Si es la primera vez, crea la hoja y añade la cabecera
                    worksheet = workbook.addWorksheet('Facturas');
                    worksheet.addRow(rows[0]);
                }

                // Añade las filas a la hoja de cálculo existente en el workbook
                worksheet.addRows(rows.slice(1)); // Ignora la cabecera
            }
        }

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
