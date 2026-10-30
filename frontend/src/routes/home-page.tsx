import { ApiStatus } from '@/features/health/components/api-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDocumentMeta } from '@/lib/use-document-meta';

export function Component() {
  useDocumentMeta({
    title: 'Home',
    description: 'Plan projects, assign tasks to your team and track their status on a board.',
  });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>System status</h2>
          </CardTitle>
          <CardDescription>The frontend talks to the backend through /api.</CardDescription>
        </CardHeader>
        <CardContent>
          <ApiStatus />
        </CardContent>
      </Card>
    </div>
  );
}
