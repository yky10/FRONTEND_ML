import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const Caja = () => {
    const [fecha, setFecha] = useState("2024-11-04"); // Valor inicial
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // Iniciar carga al hacer una nueva solicitud
            try {
                const response = await axios.get(`http://localhost:3001/caja/arqueo-caja/${fecha}`);
                setData(response.data);
            } catch (err) {
                setError(err.response ? err.response.data.message : "Error al obtener datos");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [fecha]); // Dependencia de fecha

    const handleFechaChange = (event) => {
        setFecha(event.target.value); // Actualizar la fecha seleccionada
    };

    const generatePDF = () => {
        const input = document.getElementById('reporte'); // Elemento a capturar

        html2canvas(input).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            const imgWidth = 190; // Ancho del PDF
            const pageHeight = pdf.internal.pageSize.height;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            let position = 0;

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`arqueo_caja_${fecha}.pdf`);
        });
    };

    if (loading) return <p>Cargando...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h1>Arqueo de Caja</h1>
            <label htmlFor="fecha">Selecciona una fecha:</label>
            <input 
                type="date" 
                id="fecha" 
                value={fecha} 
                onChange={handleFechaChange} 
            />
            <button onClick={generatePDF}>Generar PDF</button>
            <hr />
            <div id="reporte">
                <h5>Arqueo de Caja - {data.fecha}</h5>
                <p>Total Ventas: Q {data.totalVentas}</p>
                <p>Total Órdenes: {data.totalOrdenes}</p>
                <h3>Órdenes</h3>
                <ul>
                    {data.ordenes.map(orden => (
                        <li key={orden.ordenId}>
                            <strong>Orden ID:</strong> {orden.ordenId}  
                            <ul>
                                {orden.items.map(item => (
                                    <li key={item.platilloId}>
                                        {item.nombrePlatillo} - Cantidad: {item.cantidad}
                                    </li>
                                ))}
                                <hr />
                            </ul>
                            Total: Q {orden.total}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Caja;