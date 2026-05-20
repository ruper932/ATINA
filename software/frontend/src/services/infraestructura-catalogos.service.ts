import { apiClient } from '@/lib/axios'

export type CatalogoOption = {
  id: number
  nombre: string
  descripcion?: string | null
}

export const infraestructuraCatalogosService = {
  getEstadosInvernadero: async (): Promise<CatalogoOption[]> => {
    const { data } = await apiClient.get<CatalogoOption[]>(
      '/infra/catalogos/estados-invernadero'
    )
    return data
  },
}