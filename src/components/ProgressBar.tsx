/**
 * Barra de progreso: muestra el porcentaje de tareas completadas.
 * Usa role="progressbar" para que los lectores de pantalla anuncien el valor.
 */
interface ProgressBarProps {
  completed: number
  total: number
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  // Evitamos dividir entre cero cuando no hay tareas.
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div className="progress">
      <div className="progress-info">
        <span>Progreso</span>
        <strong>{percent}%</strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Tareas completadas"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        {/* El ancho de la barra interna representa el porcentaje. */}
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
