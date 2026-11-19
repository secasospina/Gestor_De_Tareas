/**
 * Pie de página con los créditos del autor y enlaces a sus perfiles.
 * Se muestra en todas las páginas (login, registro y tareas).
 */
import { AUTHOR } from '../config/author'
import { BriefcaseIcon, CodeBranchIcon } from './icons'

export function Footer() {
  // El año se calcula solo, así el copyright no queda desactualizado.
  const year = new Date().getFullYear()

  return (
    <footer className="app-footer">
      <p>
        © {year} Gestor de Tareas · Desarrollado por <strong>{AUTHOR.name}</strong>
      </p>

      <nav className="footer-links" aria-label="Perfiles del autor">
        {/* target="_blank" abre en otra pestaña; rel="noopener noreferrer" es por seguridad. */}
        <a href={AUTHOR.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub de Sebastián (se abre en otra pestaña)">
          <CodeBranchIcon size={16} />
          GitHub
        </a>
        <a href={AUTHOR.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn de Sebastián (se abre en otra pestaña)">
          <BriefcaseIcon size={16} />
          LinkedIn
        </a>
      </nav>
    </footer>
  )
}
