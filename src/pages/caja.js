import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AllowedAccess } from 'react-permission-role';
import NoPermission from "./NoPermission";

const Caja = () => {
   // const [fecha, setFecha] = useState("2024-11-07"); // Valor inicial
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
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
    }, [fecha]); 

    const handleFechaChange = (event) => {
        setFecha(event.target.value); 
    };

    const titulo = "Informe de Arqueo de caja diarias"; 
    const descripcion = "Este reporte muestra el total ventas diarias de todos los meseros."; 

    const generatePDF = (titulo, descripcion) => {
        const input = document.getElementById('reporte'); // Elemento a capturar
        const margenIzquierdo = 14;
        const margenSuperior = 20;
        const margenDerecho = 14;
        const imgWidth = 210 - margenIzquierdo - margenDerecho;
    
        html2canvas(input).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            pdf.setTextColor(255, 165, 0);
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.text(String(titulo), margenIzquierdo, margenSuperior);
    
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text(String(descripcion), margenIzquierdo, margenSuperior + 10);
    
            pdf.setLineWidth(0.5);
            pdf.line(margenIzquierdo, margenSuperior + 12, 196 - margenDerecho, margenSuperior + 12);
    
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const fechaGeneracion = new Date().toLocaleDateString();
            pdf.text("Fecha de Informe Generado: " + fechaGeneracion, 118, margenSuperior + 25);
    
            const imgHeight = (canvas.height * imgWidth) / canvas.width; 
            const scaleFactor = 1.5; 
            const newImgWidth = imgWidth * scaleFactor; 
            const newImgHeight = imgHeight * scaleFactor;
    
            // Añadir la imagen a la primera página
            let position = margenSuperior + 30; 
            pdf.addImage(imgData, 'PNG', margenIzquierdo, position, newImgWidth, newImgHeight);
    
            // Calcular cuánto espacio queda después de añadir la imagen
            let heightLeft = newImgHeight - (pdf.internal.pageSize.height - position);
    
            // Añadir más páginas si es necesario
            while (heightLeft > 0) {
                pdf.addPage();
                position = heightLeft > (pdf.internal.pageSize.height - margenSuperior) ? 0 : heightLeft;
                pdf.addImage(imgData, 'PNG', margenIzquierdo, position, newImgWidth, newImgHeight);
                heightLeft -= pdf.internal.pageSize.height; 
            }
    
            // Guardar el PDF
            pdf.save(`arqueo_caja_${fechaGeneracion}.pdf`);
        });
    };
    if (loading) return <p>Cargando...</p>;
    if (error) return <p>{error}</p>;
    const totalVentas = data.ordenes.reduce((total, orden) => total + Number(orden.total), 0);


    return (
        <AllowedAccess 
        roles={["admin"]} 
        permissions="manage-users" 
        renderAuthFailed={<NoPermission />}
        isLoading={<p>Cargando...</p>}
    >
        <div >
            <h1>Arqueo de Caja</h1>
            <br />
            <div >
                    <div className="search-container">
                    <label htmlFor="fecha">Ingresa una fecha:</label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={handleFechaChange} // Llama a la función de búsqueda
                            className="search-input"
                            placeholder="Buscar"
                        />
                    </div>
                </div>
            <div className="d-flex justify-content-end">
            <button className="btn btn-primary"  onClick={() =>generatePDF(titulo, descripcion)}>
                Generar PDF
                </button>
            </div>
            <hr />
            <div id="reporte">
                <h5>Arqueo de Caja - {data.fecha}</h5>
                <p>Total Ventas: Q {totalVentas}</p>
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
        </AllowedAccess>
    );
};

export default Caja;