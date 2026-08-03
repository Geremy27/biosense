import { NavLink } from 'react-router';

type PatientSubNavProps = {
  patientId: string;
};

// Renders Ver / Editar tabs for a patient detail route.
export function PatientSubNav({ patientId }: PatientSubNavProps) {
  const basePath = `/provider/patients/${patientId}`;

  return (
    <nav className="mt-6 flex flex-wrap gap-2" aria-label="Secciones del paciente">
      <NavLink
        to={basePath}
        end
        className={({ isActive }) => (isActive ? 'filter-tab-active' : 'filter-tab')}
      >
        Ver
      </NavLink>
      <NavLink
        to={`${basePath}/edit`}
        className={({ isActive }) => (isActive ? 'filter-tab-active' : 'filter-tab')}
      >
        Editar
      </NavLink>
      <NavLink
        to={`${basePath}/medical-histories`}
        className={({ isActive }) => (isActive ? 'filter-tab-active' : 'filter-tab')}
      >
        Historial
      </NavLink>
      <NavLink
        to={`${basePath}/labs`}
        className={({ isActive }) => (isActive ? 'filter-tab-active' : 'filter-tab')}
      >
        Laboratorios
      </NavLink>
      <NavLink
        to={`${basePath}/recommendations`}
        className={({ isActive }) => (isActive ? 'filter-tab-active' : 'filter-tab')}
      >
        Recomendaciones
      </NavLink>
    </nav>
  );
}
