/**
 * Botones para filtrar la lista: todas, pendientes o completadas.
 * Muestra cuántas tareas hay en cada grupo.
 */
import type { TaskFilter } from '../types/task'
import type { TaskSummary } from '../utils/tasks'

interface TaskFiltersProps {
  value: TaskFilter
  onChange: (filter: TaskFilter) => void
  summary: TaskSummary
}

export function TaskFilters({ value, onChange, summary }: TaskFiltersProps) {
  // Lista de opciones: así el JSX no repite tres botones casi iguales.
  const options: { id: TaskFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Todas', count: summary.total },
    { id: 'pending', label: 'Pendientes', count: summary.pending },
    { id: 'completed', label: 'Completadas', count: summary.completed },
  ]

  return (
    <div className="filters" role="group" aria-label="Filtrar tareas">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`filter-btn ${value === option.id ? 'is-active' : ''}`}
          // aria-pressed indica a los lectores de pantalla cuál filtro está activo.
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.label}
          <span className="filter-count">{option.count}</span>
        </button>
      ))}
    </div>
  )
}
