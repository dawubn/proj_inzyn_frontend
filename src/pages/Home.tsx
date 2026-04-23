import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex">

      // left side
      <div className="w-1/2 bg-gray-100 flex flex-col justify-between">

        // header left
        <div className="p-6">
          <h1 className="font-semibold text-lg">CerberDoc</h1>
        </div>

        //logo
        <div className="flex justify-center items-center flex-1">
          <img
            src="/logo.svg"
            alt="logo"
            className="w-100"
          />
        </div>

        // footer left
        <div className="p-6 text-sm text-gray-500">
          "Project carried out as part of an engineering thesis."
        </div>

      </div>

      // right side
      <div className="w-1/2 bg-white flex flex-col justify-between">

        // header right
        <div className="p-6 flex justify-end">
          <a href="#" className="text-sm underline">
            Contact us
          </a>
        </div>

        // form
        <div className="flex justify-center items-center flex-1">

          <Card className="w-[400px] min-h-[520px] border border-gray-200 shadow-none ring-0 bg-white">
            
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Register
              </CardTitle>
              <p className="text-sm text-gray-500">
                Enter your email below to login to your account
              </p>
            </CardHeader>

            <CardContent className="space-y-8">

              <div className="space-y-1">
                <Label>Email</Label>
                <Input className="border-gray-200" />
              </div>

              <div className="space-y-1">
                <Label>Password</Label>
                <Input type="password" className="border-gray-200 " />
              </div>

              <div className="space-y-1">
                <Label>Repeat password</Label>
                <Input type="password" className="border-gray-200 " />
              </div>

              <Button className="w-full bg-black text-white hover:bg-black/90 cursor-pointer"> 
                Register
              </Button>

              <p className="text-xs text-gray-500 text-center leading-relaxed">
                By clicking continue, you agree to our{" "}
                <a href="#" className="underline hover:text-black">
                    Terms of Service
                </a>{" "}
                    and{" "}
                <a href="#" className="underline hover:text-black">
                    Privacy Policy
                </a>.
              </p>

              

              <div className="flex justify-center items-center gap-2 text-sm text-gray-700 hover:text-black cursor-pointer">
  <ArrowRight size={16} />
  <a href="#" className="underline">
    Login
  </a>
</div>

            </CardContent>
          </Card>

        </div>

        //footer right
        <div className="p-6" />

      </div>

    </div>
  );
}