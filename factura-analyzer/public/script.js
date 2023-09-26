document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('analyzeButton').addEventListener('click', async () => {
        const xmlFile = document.getElementById('xmlFile').files[0];
        const formData = new FormData();
        formData.append('xmlFile', xmlFile);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const excelData = await response.arrayBuffer();
                const blob = new Blob([excelData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = URL.createObjectURL(blob);
                const downloadLink = document.getElementById('downloadLink');
                downloadLink.href = url;
                downloadLink.style.display = 'block';
            } else {
                alert('Error al analizar la factura');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
});