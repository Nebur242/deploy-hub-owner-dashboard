import Link from "next/link";
import { Mail } from "lucide-react";
import AuthLayout from "../components/auth-layout";
import { Button } from "@/components/ui/button";

export default function Homepage() {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-6">
        <form className="py-6 md:py-8">
          <div className="space-y-5">
            <Link href={"/auth/register"}>
              <Button className="w-full" size={"lg"}>
                <Mail />
                Sign Up with Email
              </Button>
            </Link>
          </div>
          <div className="text-center text-sm mt-6">
            Already have a Maketou account ?{" "}
            <Link href="/auth/login" className="underline underline-offset-4">
              Login
            </Link>
          </div>
        </form>
        <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
          By clicking continue, you agree to our{" "}
          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </div>
      </div>
    </AuthLayout>
  );
}
