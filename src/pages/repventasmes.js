import React, { useState, useEffect, useRef } from "react";
import Axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function ReporteVentasPorMesa() {
    const [ventasPorMesa, setVentasPorMesa] = useState([]);
    const [ventasFiltradas, setVentasFiltradas] = useState([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5); // Cambiar el número de elementos por página si es necesario
    const reportRef = useRef();

    useEffect(() => {
        const fetchVentasPorMesa = async () => {
            try {
                const response = await Axios.get("http://localhost:3001/reporte/ventas-por-mesa");
                setVentasPorMesa(response.data.reporte);
                setVentasFiltradas(response.data.reporte);
            } catch (error) {
                console.error("Error al obtener ventas por mesa:", error);
            }
        };

        fetchVentasPorMesa();
    }, []);

    const handleSearch = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        setSearch(searchTerm);

        const filtered = ventasPorMesa.filter(
            (venta) =>
                venta.numero_mesa.toString().includes(searchTerm) ||
                venta.total_ventas.toString().includes(searchTerm)
        );
        setVentasFiltradas(filtered);
    };

    // ** Paginación: Dividir los datos por páginas **
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = ventasFiltradas.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // ** Llamada a generarPDF con título y descripción como cadenas de texto **
    const titulo = "Informe de Ventas por Mesa"; // Título como cadena
    const descripcion = "Este reporte muestra el total de ventas por cada mesa en el sistema."; // Descripción como cadena
    
    const contenidoTabla = ventasFiltradas.map(venta => 
        `Mesa: ${venta.numero_mesa}, Total Ventas: ${parseFloat(venta.total_ventas).toFixed(2)}`
    ).join('\n'); // Crear contenido dinámico para la tabla

    const generarPDF = (titulo, descripcion, contenidoTabla) => {
        const input = reportRef.current;

        // Definir márgenes (en mm)
        const margenIzquierdo = 14;
        const margenSuperior = 20;
        const margenDerecho = 14;
        const margenInferior = 14;

        // Ancho de la página A4
        const imgWidth = 210 - margenIzquierdo - margenDerecho; // Ancho total menos márgenes

        // Generar la imagen del contenido de la tabla usando html2canvas
        html2canvas(input, {
            margin: { top: margenSuperior, left: margenIzquierdo, right: margenDerecho, bottom: margenInferior }
        }).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF();

            // Cambiar el color del título a naranja
            pdf.setTextColor(255, 165, 0); // RGB para el color naranja
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.text(String(titulo), margenIzquierdo, margenSuperior); // Título dinámico como string

            // Descripción debajo del título
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text(String(descripcion), margenIzquierdo, margenSuperior + 10); // Descripción dinámica como string

            // Línea separadora debajo de la descripción
            pdf.setLineWidth(0.5);
            pdf.line(margenIzquierdo, margenSuperior + 12, 196 - margenDerecho, margenSuperior + 12);  // Línea horizontal

            // Fecha de generación y número de página
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const fechaGeneracion = new Date().toLocaleDateString(); // formato dd/mm/yyyy
            pdf.text("Fecha de generación: " + fechaGeneracion, margenIzquierdo, margenSuperior + 25);
            pdf.text("Página: " + pdf.internal.getNumberOfPages(), 180, margenSuperior + 25); // Número de página dinámico

            // Agregar la imagen de la tabla, respetando los márgenes
            pdf.addImage(imgData, "PNG", margenIzquierdo, margenSuperior + 30, imgWidth, canvas.height * imgWidth / canvas.width);
            
            // Generar la vista previa del PDF (en lugar de descarga directa)
            const previewBlob = pdf.output('blob');
            const url = URL.createObjectURL(previewBlob);
            
            // Abrir la vista previa en una nueva ventana
            const previewWindow = window.open(url, '_blank');

            // Después de cargar la ventana de vista previa, podemos permitir al usuario imprimir o descargar
            previewWindow.onload = () => {
                previewWindow.print(); // Esto abrirá el cuadro de diálogo de impresión automáticamente
            };

            // Si prefieres permitir que el usuario descargue el archivo manualmente, descomenta esta línea
            // pdf.save('reporte_ventas_por_mesa.pdf');
        });
    };

    return (
        <div className="container">
            <h1>Informe de Ventas por Mesa</h1>
            <br />
            <div className="d-flex justify-content-end mb-4">
                <div className="search-container">
                    <input
                        type="text"
                        value={search}
                        onChange={handleSearch} // Llama a la función de búsqueda
                        className="search-input"
                        placeholder="Buscar"
                    />
                </div>
            </div>

            <div ref={reportRef}>
                <table className="table table-striped table-bordered table-hover">
                    <thead>
                        <tr>
                            <th scope="col">Número de Mesa</th>
                            <th scope="col">Total Ventas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length === 0 ? (
                            <tr>
                                <td colSpan="2">No se encontraron resultados</td>
                            </tr>
                        ) : (
                            currentItems.map((venta, index) => (
                                <tr key={index}>
                                    <td>{venta.numero_mesa}</td>
                                    <td>{parseFloat(venta.total_ventas).toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <div className="d-flex justify-content-center">
                <nav>
                    <ul className="pagination">
                        {[...Array(Math.ceil(ventasFiltradas.length / itemsPerPage))].map((_, index) => (
                            <li
                                key={index}
                                className={`page-item ${index + 1 === currentPage ? "active" : ""}`}
                            >
                                <button
                                    className="page-link"
                                    onClick={() => paginate(index + 1)}
                                >
                                    {index + 1}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            <div className="d-flex justify-content-end">
                <button className="btn btn-primary" onClick={() => generarPDF(titulo, descripcion, contenidoTabla)}>
                    Generar PDF
                </button>
            </div>
        </div>
    );
}

export default ReporteVentasPorMesa;
