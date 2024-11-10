import "../style/empleado.css";
import React, { useState, useEffect, useRef } from "react";
import Axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { AllowedAccess } from 'react-permission-role';
import NoPermission from "./NoPermission";


function ReporteUser() {
    const [personas, setPersonas] = useState([]);
    const [usuariolista, setusuariolista] = useState([]);
    const [roles, setRoles] = useState([]);
    const [estados, setEstados] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const reportRef = useRef();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const personasResponse = await Axios.get("http://localhost:3001/obtenerlistapersonas");
                setPersonas(personasResponse.data);
                const rolesResponse = await Axios.get("http://localhost:3001/obtenerrol");
                setRoles(rolesResponse.data);
                const estadosResponse = await Axios.get("http://localhost:3001/obtenerestado");
                setEstados(estadosResponse.data);
                getUsuario();
            } catch (error) {
                console.error("Error fetching data:", error);
                // Aquí podrías establecer un estado para mostrar un mensaje al usuario.
            }
        };

        fetchData();
    }, []);

    const getUsuario = async () => {
        try {
            const response = await Axios.get("http://localhost:3001/obteneruser");
            setusuariolista(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(usuariolista.length / itemsPerPage); i++) {
        pageNumbers.push(i);
    }

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const sortedItems = [...usuariolista].sort((a, b) => {
        if (sortConfig.key) {
            const aField = getFieldValue(a);
            const bField = getFieldValue(b);
            if (aField < bField) return sortConfig.direction === "asc" ? -1 : 1;
            if (aField > bField) return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
    });

    const getFieldValue = (user) => {
        switch (sortConfig.key) {
            case "empleado":
                return personas.find((p) => p.id === user.id_persona)?.primer_nombre || "";
            case "apellido":
                return personas.find((p) => p.id === user.id_persona)?.primer_apellido || "";
            case "rol":
                return roles.find((r) => r.id_rol === user.rol_id)?.nombre || "";
            case "estado":
                return estados.find((e) => e.id_estado === user.estado_id)?.descripcion || "";
            default:
                return user[sortConfig.key];
        }
    };

    const currentSortedItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);

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

            pdf.save("reporte_usuarios.pdf");
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
                <h1>Informe de Usuarios Activo o Inactivo</h1>
                <br />
                <div ref={reportRef}>
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th scope="col" onClick={() => handleSort("id_usuario")}>Id</th>
                                <th scope="col" onClick={() => handleSort("empleado")}>Empleado</th>
                                <th scope="col" onClick={() => handleSort("apellido")}>Apellido</th>
                                <th scope="col" onClick={() => handleSort("rol")}>Rol</th>
                                <th scope="col" onClick={() => handleSort("estado")}>Estado</th>
                                <th scope="col" onClick={() => handleSort("username")}>Usuario</th>
                                <th scope="col" onClick={() => handleSort("fecha_creacion")}>Fecha de creación</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentSortedItems.map((val) => {
                                const empleado = personas.find((p) => p.id === val.id_persona);
                                const rol = roles.find((r) => r.id_rol === val.rol_id);
                                const estado = estados.find((e) => e.id_estado === val.estado_id);

                                return (
                                    <tr key={val.id_usuario}>
                                        <th>{val.id_usuario}</th>
                                        <td>{empleado ? empleado.primer_nombre : "No disponible"}</td>
                                        <td>{empleado ? empleado.primer_apellido : "No disponible"}</td>
                                        <td>{rol ? rol.nombre : "No disponible"}</td>
                                        <td>{estado ? estado.descripcion : "No disponible"}</td>
                                        <td>{val.username}</td>
                                        <td>{val.fecha_creacion}</td>
                                    </tr>
                                );
                            })}
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

export default ReporteUser;
