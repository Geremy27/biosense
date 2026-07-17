import { type RouteConfig, index, prefix, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('api/auth/*', 'routes/api.auth.tsx'),

  ...prefix('admin', [
    route('login', 'routes/admin/login.tsx'),
    route('', 'routes/admin/_layout.tsx', [
      index('routes/admin/index.tsx'),
      route('organizations', 'routes/admin/organizations/index.tsx'),
      route('organizations/new', 'routes/admin/organizations/new.tsx'),
      route('organizations/:id', 'routes/admin/organizations/$id.tsx'),
      route('users', 'routes/admin/users/index.tsx'),
      route('users/new', 'routes/admin/users/new.tsx'),
      route('users/:id', 'routes/admin/users/$id.tsx'),
    ]),
  ]),

  ...prefix('provider', [
    route('login', 'routes/provider/login.tsx'),
    route('', 'routes/provider/_layout.tsx', [
      index('routes/provider/index.tsx'),
      route('patients', 'routes/provider/patients/index.tsx'),
      route('patients/new', 'routes/provider/patients/new.tsx'),
      route('patients/:id', 'routes/provider/patients/$id/_layout.tsx', [
        index('routes/provider/patients/$id/index.tsx'),
        route('edit', 'routes/provider/patients/$id/edit.tsx'),
        route('labs', 'routes/provider/patients/$id/labs/index.tsx'),
        route('labs/new', 'routes/provider/patients/$id/labs/new.tsx'),
        route('labs/:reportId', 'routes/provider/patients/$id/labs/$reportId.tsx'),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
