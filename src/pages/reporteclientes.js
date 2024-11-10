import "../style/empleado.css";
import React, { useState, useEffect, useRef } from "react";
import Axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { AllowedAccess } from 'react-permission-role';
import NoPermission from "../pages/NoPermission.js";

function ReporteCliente() {
    const [clientes, setClientes] = useState([]);
    const reportRef = useRef(); // Referencia para capturar el contenido del reporte
    
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Estado para ordenación
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

    useEffect(() => {
        const fetchClientes = async () => {
            try {
                const response = await Axios.get("http://localhost:3001/cliente/listar");
                setClientes(response.data);
            } catch (error) {
                console.error("Error fetching clients:", error);
            }
        };
        fetchClientes();
    }, []);

    // Lógica de paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    // Cambio de página
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Cálculo de paginación
    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(clientes.length / itemsPerPage); i++) {
        pageNumbers.push(i);
    }

    // Función para manejar la ordenación
    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const sortedItems = [...clientes].sort((a, b) => {
        let aField = a[sortConfig.key];
        let bField = b[sortConfig.key];

        if (aField < bField) {
            return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aField > bField) {
            return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
    });

    const currentSortedItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);

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

            pdf.save("reporte_clientes.pdf");
        });
    };

    return (
        <AllowedAccess 
            roles={["admin"]} 
            permissions="manage-users" 
            renderAuthFailed={<NoPermission/>}
            isLoading={<p>Cargando...</p>}
        >
            <div className="container">
                <h1>Informe de Clientes</h1>
                <br />
                <div ref={reportRef}>
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th scope="col" onClick={() => handleSort("id")}>ID</th>
                                <th scope="col" onClick={() => handleSort("nit_cliente")}>NIT Cliente</th>
                                <th scope="col" onClick={() => handleSort("nombre")}>Nombre</th>
                                <th scope="col" onClick={() => handleSort("apellido")}>Apellido</th>
                                <th scope="col" onClick={() => handleSort("direccion")}>Dirección</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentSortedItems.map((cliente) => (
                                <tr key={cliente.id}>
                                    <th>{cliente.id}</th>
                                    <td>{cliente.nit_cliente}</td>
                                    <td>{cliente.nombre}</td>
                                    <td>{cliente.apellido}</td>
                                    <td>{cliente.direccion}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="d-flex justify-content-end"> {/* Botón alineado a la derecha */}
                    <button className="btn btn-primary" onClick={generarPDF}>
                        Generar PDF
                    </button>
                </div>
                <nav>
                    <ul className="pagination">
                        {pageNumbers.map((number) => (
                            <li key={number} className="page-item">
                                <a
                                    href="#!"
                                    className="page-link"
                                    onClick={() => paginate(number)}
                                >
                                    {number}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </AllowedAccess>
    );
}

export default ReporteCliente;