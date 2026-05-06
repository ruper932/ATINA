// src/pages/dashboard/ReportesVistasPage.tsx
import React, { useState, useEffect } from 'react';
import { reportesService } from '../../services/reportes.service';

type ReportType = 'lecturas' | 'alertas' | 'inventario' | 'riego' | 'predicciones';
type DynamicData = Record<string, unknown>;

export const ReportesVistasPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>('lecturas');
  const [data, setData] = useState<DynamicData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Definimos y ejecutamos la función asíncrona DENTRO del useEffect
    // Esto resuelve el error del linter "react-hooks/set-state-in-effect"
    const fetchReportData = async () => {
      setLoading(true);
      try {
        let result: DynamicData[] = [];
        switch (activeReport) {
          case 'lecturas':
            result = await reportesService.getLecturasSensor() as unknown as DynamicData[];
            break;
          case 'alertas':
            result = await reportesService.getAlertasInvernadero() as unknown as DynamicData[];
            break;
          case 'inventario':
            result = await reportesService.getInventarioDispositivos() as unknown as DynamicData[];
            break;
          case 'riego':
            result = await reportesService.getRiegoEjecutado() as unknown as DynamicData[];
            break;
          case 'predicciones':
            result = await reportesService.getPrediccionesAgua() as unknown as DynamicData[];
            break;
        }
        setData(result);
      } catch (error) {
        console.error("Error cargando el reporte:", error);
      } finally {
        setLoading(false);
      }
    };

    // Llamamos a la función asíncrona devolviendo void
    void fetchReportData();
  }, [activeReport]);

  const renderTable = () => {
    if (data.length === 0) return <p className="text-gray-500 mt-4">No hay datos disponibles para este reporte.</p>;

    const columns = Object.keys(data[0]);

    return (
      <div className="overflow-x-auto mt-6 bg-white shadow-md rounded-lg">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="uppercase tracking-wider border-b-2 border-gray-200 dark:border-neutral-600 bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-6 py-4 font-semibold text-gray-700">
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b border-gray-100 dark:border-neutral-600 hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col} className="px-6 py-4">
                    {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Reportes de Vistas</h1>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'lecturas', label: 'Lecturas por Sensor' },
          { id: 'alertas', label: 'Alertas por Invernadero' },
          { id: 'inventario', label: 'Inventario Dispositivos' },
          { id: 'riego', label: 'Riego Ejecutado' },
          { id: 'predicciones', label: 'Predicciones de Agua' }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setActiveReport(btn.id as ReportType)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeReport === btn.id 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500 font-medium">Cargando reporte...</p>
        </div>
      ) : (
        renderTable()
      )}
    </div>
  );
};