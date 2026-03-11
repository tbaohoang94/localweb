import LoginForm from "@/components/login-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-sm relative z-10 animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground text-lg font-bold">V</span>
          </div>
          <h1 className="text-2xl font-bold">Vertrieb OS</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Melde dich an, um fortzufahren
          </p>
        </div>
        <Card className="shadow-lg border-border/50 backdrop-blur-sm bg-card/95">
          <CardContent className="p-8">
            <LoginForm />
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          Sales Performance Platform
        </p>
      </div>
    </div>
  );
}
