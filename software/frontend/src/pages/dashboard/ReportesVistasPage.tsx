import React, { useState, useEffect } from 'react';
import { reportesService } from '../../services/reportes.service';

type ReportType = 'lecturas' | 'alertas' | 'inventario' | 'riego' | 'predicciones';
type DynamicData = Record<string, unknown>;

export const ReportesVistasPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>('lecturas');
  const [data, setData] = useState<DynamicData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
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

    void fetchReportData();
  }, [activeReport]);

  const renderTable = () => {
    if (data.length === 0) return <p className="text-gray-500 dark:text-gray-400 mt-4">No hay datos disponibles para este reporte.</p>;

    const columns = Object.keys(data[0]);

    return (
      <div className="overflow-x-auto mt-6 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl backdrop-blur-sm">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-6 py-4 font-bold text-gray-700 dark:text-gray-200">
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-blue-500/10 transition-colors">
                {columns.map((col) => (
                  <td key={col} className="px-6 py-4 text-gray-600 dark:text-gray-300">
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
    <div className="p-6 max-w-7xl mx-auto min-h-screen transition-colors duration-300">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-800 dark:text-white tracking-tight">
        Reportes de Vistas
      </h1>
      
      <div className="flex flex-wrap gap-3 mb-8">
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
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 border ${
              activeReport === btn.id 
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30' 
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-48 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Sincronizando datos...</p>
        </div>
      ) : (
        renderTable()
      )}
    </div>
  );
};