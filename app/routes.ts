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
] satisfies RouteConfig;
