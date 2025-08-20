import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'Biosense' }, { name: 'description', content: 'Biosense' }];
}

export default function Home() {
  return (
    <div className="flex h-screen w-screen bg-gray-900 p-8">
      <span className="text-white text-4xl font-semibold">Biosense</span>
    </div>
  );
}
