import React, { useState, useEffect, useRef } from "react";
import Axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function ReporteVentasPorMesa() {
    const [ventasPorMesa, setVentasPorMesa] = useState([]);
    const [ventasFiltradas, setVentasFiltradas] = useState([]);
    const [search, setSearch] = useState("");
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

    const handleSort = (column) => {
        const sortedData = [...ventasFiltradas].sort((a, b) => {
            if (a[column] < b[column]) return -1;
            if (a[column] > b[column]) return 1;
            return 0;
        });
        setVentasFiltradas(sortedData);
    };

    const generarPDF = () => {
        const input = reportRef.current;
        html2canvas(input).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF();
            const imgWidth = 210;
            const pageHeight = 295;
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

            pdf.save("reporte_ventas_por_mesa.pdf");
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
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th scope="col" onClick={() => handleSort("numero_mesa")}>Número de Mesa</th>
                            <th scope="col" onClick={() => handleSort("total_ventas")}>Total Ventas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ventasFiltradas.map((venta, index) => (
                            <tr key={index}>
                                <td>{venta.numero_mesa}</td>
                                <td>{parseFloat(venta.total_ventas).toFixed(2)}</td>
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
    );
}

export default ReporteVentasPorMesa;
