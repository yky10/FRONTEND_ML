import React, { useState, useEffect, useRef } from "react";
import Axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { AllowedAccess } from 'react-permission-role';
import NoPermission from "./NoPermission";
import "../style/empleado.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function ReporteVentasDiarias() {
    const [ventas, setVentas] = useState([]);
    const [ventasFiltradas, setVentasFiltradas] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedDate, setSelectedDate] = useState(null); // Para guardar la fecha seleccionada
    const reportRef = useRef();

    useEffect(() => {
        const fetchVentas = async (startDate = null, endDate = null) => {
            try {
                const response = await Axios.get("http://localhost:3001/reporte/ventas-diarias", {
                    params: {
                        startDate: startDate ? startDate.toISOString().slice(0, 10) : undefined,
                        endDate: endDate ? endDate.toISOString().slice(0, 10) : undefined,
                    },
                });
                setVentas(response.data.reporte);
                setVentasFiltradas(response.data.reporte);
            } catch (error) {
                console.error("Error al obtener ventas diarias:", error);
            }
        };

        fetchVentas();
    }, []);

    // Función para manejar la búsqueda por texto
    const handleSearch = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        setSearch(searchTerm);

        // Filtra las ventas según el campo 'nombre_usuario'
        const filtered = ventas.filter(
            (venta) =>
                venta.nombre_usuario.toLowerCase().includes(searchTerm)  // Ajustado para buscar en 'nombre_usuario'
        );
        setVentasFiltradas(filtered);
    };

    // Función para manejar la selección de fecha
    const handleDateChange = (date) => {
        setSelectedDate(date);
        if (date) {
            const formattedDate = date.toLocaleDateString(); // Formato de fecha en español por ejemplo "DD/MM/YYYY"
            // Filtra las ventas por fecha seleccionada
            const filteredByDate = ventas.filter((venta) => {
                const fechaVenta = new Date(venta.fecha); // Asumiendo que 'venta.fecha' es un string de tipo 'YYYY-MM-DD'
                return fechaVenta.toLocaleDateString() === formattedDate;
            });
            setVentasFiltradas(filteredByDate);
        } else {
            setVentasFiltradas(ventas); // Si no se selecciona ninguna fecha, se muestran todas las ventas
        }
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

            pdf.save("reporte_ventas_diarias.pdf");
        });
    };

    // Función para formatear la fecha
    const formatearFecha = (fecha) => {
        const date = new Date(fecha);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses empiezan desde 0
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <AllowedAccess 
            roles={["admin"]} 
            permissions="manage-users" 
            renderAuthFailed={<NoPermission />}
            isLoading={<p>Cargando...</p>}
        >
            <div className="container">
                <h1>Informe de Ventas Diarias</h1>
                <br />
                <div className="d-flex justify-content-between mb-4">
                    <div className="search-container">
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearch} // Llama a la función de búsqueda
                            className="search-input"
                            placeholder="Buscar"
                        />
                    </div>

                    <div>
                        <DatePicker
                            selected={selectedDate}
                            onChange={handleDateChange} // Función para manejar el cambio de fecha
                            dateFormat="dd/MM/yyyy"
                            className="form-control"
                            placeholderText="  Selecciona una fecha"
                        />
                    </div>
                </div>

                <div ref={reportRef}>
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th scope="col">Fecha</th>
                                <th scope="col">Total Órdenes</th>
                                <th scope="col">Total Ventas</th>
                                <th scope="col">Nombre Usuario</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventasFiltradas.map((venta, index) => (
                                <tr key={index}>
                                    <td>{formatearFecha(venta.fecha)}</td>
                                    <td>{venta.total_ordenes}</td>
                                    <td>{venta.total_ventas}</td>
                                    <td>{venta.nombre_usuario}</td>
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

export default ReporteVentasDiarias;
