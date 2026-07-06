import { useLocation, useNavigation } from 'react-router';

type UseFormPendingOptions = {
  /** Match a hidden `intent` field value (e.g. "update", "delete"). */
  intent?: string;
  /** Treat submission as active when the form has no intent or a different intent. */
  excludeIntent?: string;
};

function normalizePath(path: string | undefined) {
  if (!path) {
    return '';
  }

  try {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return new URL(path).pathname;
    }
  } catch {
    // Fall through to pathname normalization.
  }

  return path.split('?')[0] ?? path;
}

function matchesCurrentRoute(formAction: string | undefined, pathname: string) {
  return normalizePath(formAction) === normalizePath(pathname);
}

// Returns whether the parent route form is submitting. Must be used inside a <Form>.
export function useFormPending(options?: UseFormPendingOptions) {
  const navigation = useNavigation();
  const { pathname } = useLocation();

  const isNavigationPending =
    navigation.formData != null &&
    (navigation.state === 'submitting' || navigation.state === 'loading') &&
    matchesCurrentRoute(navigation.formAction, pathname);

  if (!isNavigationPending) {
    return { isPending: false };
  }

  const formIntent = navigation.formData?.get('intent');

  if (options?.intent !== undefined) {
    return { isPending: formIntent === options.intent };
  }

  if (options?.excludeIntent !== undefined) {
    return { isPending: formIntent !== options.excludeIntent };
  }

  return { isPending: true };
}
