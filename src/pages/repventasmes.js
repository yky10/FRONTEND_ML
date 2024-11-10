import React, { useState, useEffect, useRef } from "react";
import Axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { AllowedAccess } from 'react-permission-role';
import NoPermission from "./NoPermission";
import "../style/empleado.css";

function ReporteVentasPorMes() {
    const [ventas, setVentas] = useState([]);
    const [ventasFiltradas, setVentasFiltradas] = useState([]);
    const [search, setSearch] = useState("");
    const reportRef = useRef();

    useEffect(() => {
        const fetchVentas = async () => {
            try {
                const response = await Axios.get("http://localhost:3001/reporte/ventas-por-mes");
                setVentas(response.data.reporte);
                setVentasFiltradas(response.data.reporte); // Inicializamos con todos los datos
            } catch (error) {
                console.error("Error al obtener ventas por mes:", error);
            }
        };

        fetchVentas();
    }, []);

    // Función para manejar la búsqueda por texto
    const handleSearch = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        setSearch(searchTerm);

        // Filtra las ventas según el campo 'anio' y 'mes'
        const filtered = ventas.filter(
            (venta) =>
                `${venta.anio}-${venta.mes}`.toLowerCase().includes(searchTerm)
        );
        setVentasFiltradas(filtered);
    };

    // Función para ordenar los datos por fecha
    const handleSort = () => {
        const sorted = [...ventasFiltradas].sort((a, b) => {
            if (a.anio === b.anio) {
                return a.mes - b.mes;
            }
            return a.anio - b.anio;
        });
        setVentasFiltradas(sorted);
    };

    // Función para generar el PDF
    const generarPDF = () => {
        const input = reportRef.current;
        html2canvas(input).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF();
            const imgWidth = 210; // Ancho en mm para A4
            const pageHeight = 295; // Altura en mm para A4
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save("reporte_ventas_por_mes.pdf");
        });
    };

    return (
        <AllowedAccess 
            roles={["admin"]} 
            permissions="manage-users" 
            renderAuthFailed={<NoPermission />}
            isLoading={<p>Cargando...</p>}
        >
            <div className="container">
                <h1>Informe de Ventas por Mes</h1>
                <br />
                <div className="d-flex justify-content-between mb-4">
                    <div className="search-container">
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearch} // Llama a la función de búsqueda
                            className="search-input"
                            placeholder="Buscar (ej. 2023-05)"
                        />
                    </div>

                    <button className="btn btn-secondary" onClick={handleSort}>
                        Ordenar por fecha
                    </button>
                </div>

                <div ref={reportRef}>
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th scope="col">Año-Mes</th>
                                <th scope="col">Total Ventas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventasFiltradas.map((venta, index) => (
                                <tr key={index}>
                                    <td>{`${venta.anio}-${String(venta.mes).padStart(2, '0')}`}</td>
                                    <td>{Number(venta.total_ventas).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="d-flex justify-content-end">
                    <button className="btn btn-primary" onClick={generarPDF}>
                        Generar PDF
                    </button>
                </div>
            </div>
        </AllowedAccess>
    );
}

export default ReporteVentasPorMes;
