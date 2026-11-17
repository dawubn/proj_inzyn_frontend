import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

// Centered card used by the password reset pages, same look as the registration page
export default function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="p-6">
        <h1 className="text-lg font-semibold">CerberDoc</h1>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-8">
        <Card className="w-full max-w-[400px] rounded-xl border border-gray-200 bg-white shadow-none ring-0">
          <CardHeader className="space-y-2 px-6 pt-8 pb-5">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <p className="text-sm leading-5 text-gray-500">{description}</p>
          </CardHeader>

          <CardContent className="px-6 pt-0 pb-6">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
