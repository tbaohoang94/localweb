import LoginForm from "@/components/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-8">Google Maps Pipeline</h1>
        <LoginForm />
        <p className="mt-4 text-sm text-gray-500">
          No account yet?{" "}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
