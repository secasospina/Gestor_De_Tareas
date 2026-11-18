/**
 * Formulario reutilizable para crear o editar una tarea.
 *
 * - Para crear: se usa sin initialValues y se limpia tras guardar.
 * - Para editar: se le pasan initialValues y un onCancel.
 * Valida los campos antes de llamar a onSubmit.
 */
import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH, validateTaskInput } from '../utils/tasks'
import type { TaskInput, TaskInputErrors } from '../types/task'
import { PlusIcon } from './icons'

interface TodoFormProps {
  /** Acción que guarda la tarea; debe lanzar un error si falla. */
  onSubmit: (input: TaskInput) => Promise<void>
  /** Valores iniciales (modo edición). */
  initialValues?: TaskInput
  /** Texto del botón principal. */
  submitLabel?: string
  /** Si se envía, se muestra un botón "Cancelar" (modo edición). */
  onCancel?: () => void
}

const EMPTY_TASK: TaskInput = { title: '', description: '' }

export function TodoForm({
  onSubmit,
  initialValues = EMPTY_TASK,
  submitLabel = 'Agregar tarea',
  onCancel,
}: TodoFormProps) {
  const [values, setValues] = useState<TaskInput>(initialValues)
  const [errors, setErrors] = useState<TaskInputErrors>({})
  const [submitting, setSubmitting] = useState(false)
  // useId genera un ID único por formulario, para que cada <label> apunte a su
  // propio campo aunque haya varios formularios abiertos (crear + editar).
  const formId = useId()

  // Un solo manejador para ambos campos: recibe qué campo cambió y su nuevo valor.
  function handleChange(field: keyof TaskInput, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateTaskInput(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      await onSubmit(values)
      // En modo creación dejamos el formulario vacío para la siguiente tarea.
      if (!onCancel) setValues(EMPTY_TASK)
    } catch {
      // El mensaje de error lo muestra la página (viene del hook useTasks).
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit} noValidate aria-label={submitLabel}>
      <label htmlFor={`${formId}-title`}>Título</label>
      <input
        id={`${formId}-title`}
        type="text"
        value={values.title}
        maxLength={TITLE_MAX_LENGTH}
        onChange={(e) => handleChange('title', e.target.value)}
        aria-invalid={Boolean(errors.title)}
      />
      {errors.title && <p className="form-error">{errors.title}</p>}

      <label htmlFor={`${formId}-description`}>Descripción</label>
      <textarea
        id={`${formId}-description`}
        rows={3}
        value={values.description}
        maxLength={DESCRIPTION_MAX_LENGTH}
        onChange={(e) => handleChange('description', e.target.value)}
        aria-invalid={Boolean(errors.description)}
      />
      {errors.description && <p className="form-error">{errors.description}</p>}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
        )}
        <button type="submit" disabled={submitting}>
          {/* En modo creación (sin onCancel) mostramos el ícono "+". */}
          {!onCancel && <PlusIcon size={16} />}
          {submitting ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
