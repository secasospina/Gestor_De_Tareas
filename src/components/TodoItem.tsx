/**
 * Una tarea de la lista.
 *
 * Permite marcarla como completada, editarla (reutilizando TodoForm)
 * y eliminarla con una confirmación en dos pasos para evitar borrados accidentales.
 */
import { useState } from 'react'
import { TodoForm } from './TodoForm'
import type { Task, TaskInput } from '../types/task'

interface TodoItemProps {
  task: Task
  onToggle: (task: Task) => Promise<void>
  onEdit: (taskId: string, input: TaskInput) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
}

export function TodoItem({ task, onToggle, onEdit, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  /** Ejecuta una acción mostrando estado ocupado; los errores los muestra la página. */
  async function runAction(action: () => Promise<void>) {
    setBusy(true)
    try {
      await action()
    } catch {
      // El hook useTasks ya guardó el mensaje de error.
    } finally {
      setBusy(false)
    }
  }

  // Modo edición: mostramos el formulario con los valores actuales.
  if (isEditing) {
    return (
      <li className="todo-item">
        <TodoForm
          initialValues={{ title: task.title, description: task.description }}
          submitLabel="Guardar cambios"
          onCancel={() => setIsEditing(false)}
          onSubmit={async (input) => {
            await onEdit(task.id, input)
            setIsEditing(false)
          }}
        />
      </li>
    )
  }

  return (
    <li className={`todo-item ${task.completed ? 'is-completed' : ''}`}>
      <label className="todo-check">
        <input
          type="checkbox"
          checked={task.completed}
          disabled={busy}
          onChange={() => runAction(() => onToggle(task))}
          aria-label={`Marcar "${task.title}" como ${task.completed ? 'pendiente' : 'completada'}`}
        />
        <span className="todo-text">
          <span className="todo-title">{task.title}</span>
          {task.description && <span className="todo-description">{task.description}</span>}
        </span>
      </label>

      <div className="todo-actions">
        {confirmingDelete ? (
          <>
            <span className="confirm-text">¿Eliminar?</span>
            <button type="button" className="btn-danger" disabled={busy} onClick={() => runAction(() => onDelete(task.id))}>
              Sí
            </button>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => setConfirmingDelete(false)}>
              No
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => setIsEditing(true)}>
              Editar
            </button>
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => setConfirmingDelete(true)}>
              Eliminar
            </button>
          </>
        )}
      </div>
    </li>
  )
}
