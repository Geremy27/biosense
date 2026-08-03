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
      route('recommendation-prompts', 'routes/admin/recommendation-prompts/index.tsx'),
      route('recommendation-prompts/:id', 'routes/admin/recommendation-prompts/$id.tsx'),
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
        route('medical-histories', 'routes/provider/patients/$id/medical-histories/index.tsx'),
        route('medical-histories/new', 'routes/provider/patients/$id/medical-histories/new.tsx'),
        route(
          'medical-histories/new-from-pdf',
          'routes/provider/patients/$id/medical-histories/new-from-pdf.tsx',
        ),
        route(
          'medical-histories/:historyId',
          'routes/provider/patients/$id/medical-histories/$historyId.tsx',
        ),
        route('labs', 'routes/provider/patients/$id/labs/index.tsx'),
        route('labs/new', 'routes/provider/patients/$id/labs/new.tsx'),
        route('labs/:reportId', 'routes/provider/patients/$id/labs/$reportId.tsx'),
        route('recommendations', 'routes/provider/patients/$id/recommendations/index.tsx'),
        route('recommendations/new', 'routes/provider/patients/$id/recommendations/new.tsx'),
        route(
          'recommendations/:recommendationId',
          'routes/provider/patients/$id/recommendations/$recommendationId.tsx',
        ),
        route(
          'recommendations/:recommendationId/share',
          'routes/provider/patients/$id/recommendations/$recommendationId.share.tsx',
        ),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
