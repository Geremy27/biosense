# Idioma de la interfaz (frontend)

## Decisión

**Toda la interfaz de usuario visible para operadores y prestadores está en español.**

- **Idioma:** español (Colombia) — `es-CO` para fechas y formatos locales.
- **Alcance:** etiquetas, botones, mensajes de error de formulario, títulos de página (`meta`), textos de ayuda, estados vacíos y mensajes del `ErrorBoundary`.
- **Fuera de alcance (por ahora):** código, logs, auditoría, comentarios, documentación técnica interna y nombres de variables/enums en inglés.

## Convenciones

| Área | Idioma | Ejemplo |
| --- | --- | --- |
| UI (routes, componentes) | Español | «Cerrar sesión», «Nueva organización» |
| Mensajes de validación mostrados al usuario | Español | «El correo es obligatorio.» |
| `html lang` | `es` | En `app/root.tsx` |
| Fechas en tablas | `toLocaleDateString('es-CO')` | `5/7/2026` |
| Roles en UI | Español | «Administrador de plataforma», «Prestador» |
| Identificadores en código / BD | Inglés | `UserRole.PLATFORM_ADMIN`, `providers` |

## Terminología

| Inglés (código) | Español (UI) |
| --- | --- |
| Platform admin | Administrador de plataforma |
| Provider | Prestador |
| Organization | Organización |
| Dashboard | Panel |
| Sign in / Sign out | Iniciar sesión / Cerrar sesión |
| Deactivate | Desactivar |
| Temporary password | Contraseña temporal |

## i18n futuro

No hay biblioteca i18n (react-i18next, etc.) en el MVP. Los textos viven directamente en los módulos de ruta y en los mensajes de validación de servicios que se muestran en formularios.

Si más adelante se necesita inglés u otros idiomas:

1. Introducir un módulo `app/i18n/` con claves y traducciones.
2. Mover los strings de rutas y de `UserValidationError` a archivos de mensajes.
3. Mantener `es-CO` como idioma por defecto.

## Dónde actualizar textos

- **Rutas:** `app/routes/**`
- **Layout admin:** `app/routes/admin/_layout.tsx`
- **Errores de formulario (usuarios):** `app/services/users.service.ts` (`validateUserInput`, `UserValidationError`)
- **Errores de login:** `app/routes/admin/login.tsx`
- **Errores de organizaciones:** acciones en `app/routes/admin/organizations/*`
- **Página de error global:** `app/root.tsx` (`ErrorBoundary`)

Al añadir una pantalla nueva, escribir todos los strings visibles en español desde el inicio.
