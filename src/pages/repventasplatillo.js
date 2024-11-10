import React, { useState, useEffect } from "react";
import Axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { AllowedAccess } from 'react-permission-role';
import NoPermission from "./NoPermission";
import "../style/empleado.css";

function ReporteVentasPlatillo() {
    const [ventas, setVentas] = useState([]);
    const [ventasFiltradas, setVentasFiltradas] = useState([]);
    const [search, setSearch] = useState("");
    const [sortColumn, setSortColumn] = useState("total_ventas");
    const [sortOrder, setSortOrder] = useState("desc");

    useEffect(() => {
        const fetchVentas = async () => {
            try {
                const response = await Axios.get("http://localhost:3001/reporte/ventas-por-platillo");
                setVentas(response.data.reporte);
                setVentasFiltradas(response.data.reporte); // Inicializamos con todos los datos
            } catch (error) {
                console.error("Error al obtener ventas por platillos:", error);
            }
        };

        fetchVentas();
    }, []);

    // Función de búsqueda que filtra las ventas
    const handleSearch = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        setSearch(searchTerm);

        // Filtra las ventas según todos los campos
        const filtered = ventas.filter(
            (venta) =>
                venta.nombre_platillo.toLowerCase().includes(searchTerm) || 
                venta.cantidad_vendida.toString().includes(searchTerm) ||
                venta.total_ventas.toString().includes(searchTerm)
        );
        setVentasFiltradas(filtered);
    };

    // Función para ordenar las columnas
    const handleSort = (column) => {
        const newSortOrder = sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
        setSortColumn(column);
        setSortOrder(newSortOrder);

        const sortedData = [...ventasFiltradas].sort((a, b) => {
            if (newSortOrder === "asc") {
                return a[column] > b[column] ? 1 : -1;
            } else {
                return a[column] < b[column] ? 1 : -1;
            }
        });

        setVentasFiltradas(sortedData);
    };

    return (
        <AllowedAccess 
            roles={["admin"]} 
            permissions="manage-users" 
            renderAuthFailed={<NoPermission />}
            isLoading={<p>Cargando...</p>}
        >
            <div className="container">
                <h1>Reporte de Ventas por Platillo</h1>
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
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th scope="col" onClick={() => handleSort("nombre_platillo")}>
                                Nombre Platillo {sortColumn === "nombre_platillo" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                            </th>
                            <th scope="col" onClick={() => handleSort("cantidad_vendida")}>
                                Cantidad Vendida {sortColumn === "cantidad_vendida" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                            </th>
                            <th scope="col" onClick={() => handleSort("total_ventas")}>
                                Total Ventas {sortColumn === "total_ventas" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {ventasFiltradas.map((venta, index) => (
                            <tr key={index}>
                                <td>{venta.nombre_platillo}</td>
                                <td>{venta.cantidad_vendida}</td>
                                <td>{venta.total_ventas}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AllowedAccess>
    );
}

export default ReporteVentasPlatillo;
