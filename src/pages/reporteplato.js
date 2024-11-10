import "../style/empleado.css";
import React, { useState, useEffect, useRef } from "react";
import Axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { AllowedAccess } from 'react-permission-role';
import NoPermission from "./NoPermission";

function ReportePlatos() {
    const [platos, setPlatos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [error, setError] = useState(""); // Estado para errores
    const reportRef = useRef(); 

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const platosResponse = await Axios.get("http://localhost:3001/platillos/listar");
                setPlatos(platosResponse.data);
                const categoriasResponse = await Axios.get("http://localhost:3001/categoria/listar");
                setCategorias(categoriasResponse.data);
            } catch (error) {
                setError("Error al cargar los datos");
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(platos.length / itemsPerPage); i++) {
        pageNumbers.push(i);
    }

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const sortedItems = [...platos].sort((a, b) => {
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

    const getCategoriaNombre = (categoriaId) => {
        const categoria = categorias.find((cat) => cat.id === categoriaId);
        return categoria ? categoria.nombre : "No disponible";
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

            pdf.save("reporte_platos.pdf");
        });
    };

    return (
        <AllowedAccess 
            roles={["admin"]} 
            permissions="manage-users" /*view-report*/
            renderAuthFailed={<NoPermission/>}
            isLoading={<p>Cargando...</p>}
        >
            <div className="container">
                <h1>Informe de Platos</h1>
                <br />
                {error && <div className="alert alert-danger">{error}</div>} {/* Mostrar errores */}
                <div ref={reportRef}>
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th scope="col" onClick={() => handleSort("id")}>Id</th>
                                <th scope="col" onClick={() => handleSort("nombre")}>Nombre</th>
                                <th scope="col" onClick={() => handleSort("categoria_id")}>Categoría</th>
                                <th scope="col" onClick={() => handleSort("precio")}>Precio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentSortedItems.map((plato) => (
                                <tr key={plato.id}>
                                    <th>{plato.id}</th>
                                    <td>{plato.nombre}</td>
                                    <td>{getCategoriaNombre(plato.categoria_id)}</td>
                                    <td>{plato.precio}</td>
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
                <nav>
                    <ul className="pagination">
                        {pageNumbers.map((number) => (
                            <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                                <a
                                    href="#!"
                                    className="page-link"
                                    onClick={() => paginate(number)}
                                    style={{ cursor: currentPage === number ? 'default' : 'pointer' }} // Desactivar el enlace de la página actual
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

export default ReportePlatos;