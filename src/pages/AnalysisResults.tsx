import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  TriangleAlert,
  CircleAlert,
  Pencil,
  Trash2,
  Expand,
} from "lucide-react";

export default function AnalysisResult() {
  return (
    <div className="mx-auto max-w-6xl pb-10">
      <Card className="border border-gray-200 bg-gray-50 shadow-none ring-0">
        <CardContent className="p-4">
          {/* top section */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold">
                RentalAgreement.pdf
              </h1>

              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <FileText size={14} />
                Rental agreement document
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-9 cursor-pointer border-gray-200 bg-white px-3 text-xs"
              >
                <Pencil size={14} />
                Edit
              </Button>

              <Button className="h-9 cursor-pointer bg-red-600 px-3 text-xs text-white hover:bg-red-700">
                <Trash2 size={14} />
                Delete
              </Button>

              <Button className="h-9 cursor-pointer bg-slate-950 px-3 text-xs text-white hover:bg-slate-900">
                Open analysis report
              </Button>
            </div>
          </div>

          {/* scores */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* score 1 */}
            <div>
              <h2 className="text-3xl font-bold text-lime-600">
                90/100
              </h2>

              <Progress
                value={90}
                className="mt-3 h-2 bg-gray-200 [&>div]:bg-lime-600"
              />

              <div className="mt-2 flex items-center gap-2">
                <p className="text-base font-semibold">
                  Total Rating
                </p>

                <CircleAlert
                  size={14}
                  className="text-gray-400"
                />
              </div>
            </div>

            {/* score 2 */}
            <div>
              <h2 className="text-3xl font-bold text-orange-500">
                67/100
              </h2>

              <Progress
                value={67}
                className="mt-3 h-2 bg-gray-200 [&>div]:bg-orange-500"
              />

              <div className="mt-2 flex items-center gap-2">
                <p className="text-base font-semibold">
                  Analysis Certainty
                </p>

                <CircleAlert
                  size={14}
                  className="text-gray-400"
                />
              </div>
            </div>

            {/* score 3 */}
            <div>
              <h2 className="text-3xl font-bold text-red-600">
                10/100
              </h2>

              <Progress
                value={10}
                className="mt-3 h-2 bg-gray-200 [&>div]:bg-red-600"
              />

              <div className="mt-2 flex items-center gap-2">
                <p className="text-base font-semibold">
                  Legal Completion
                </p>

                <CircleAlert
                  size={14}
                  className="text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* content */}
          <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
            {/* OCR preview */}
            <Card className="border border-gray-200 bg-white shadow-none ring-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">
                    Document Highlight
                  </h3>

                  <button className="cursor-pointer text-gray-500 hover:text-black">
                    <Expand size={16} />
                  </button>
                </div>

                <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <img
                    src="https://placehold.co/900x1200/png"
                    alt="OCR preview"
                    className="w-full rounded-md"
                  />
                </div>
              </CardContent>
            </Card>

            {/* warnings */}
            <Card className="border border-gray-200 bg-white shadow-none ring-0">
              <CardContent className="p-4">
                <h3 className="text-base font-semibold">
                  Brief Opinion
                </h3>

                <div className="mt-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <TriangleAlert
                      size={16}
                      className="mt-0.5 shrink-0 text-orange-500"
                    />

                    <p className="text-xs leading-6 text-gray-700">
                      Missing tenant PESEL number in section 1.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <TriangleAlert
                      size={16}
                      className="mt-0.5 shrink-0 text-orange-500"
                    />

                    <p className="text-xs leading-6 text-gray-700">
                      Incomplete landlord address information.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <TriangleAlert
                      size={16}
                      className="mt-0.5 shrink-0 text-orange-500"
                    />

                    <p className="text-xs leading-6 text-gray-700">
                      OCR confidence below recommended threshold
                      on page 2.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <TriangleAlert
                      size={16}
                      className="mt-0.5 shrink-0 text-orange-500"
                    />

                    <p className="text-xs leading-6 text-gray-700">
                      Signature section appears incomplete.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}