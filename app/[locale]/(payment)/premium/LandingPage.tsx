import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calculator,
  BarChartIcon as ChartBar,
  ClipboardList,
  Clock,
  HeartPulse,
  Layout,
  LineChart,
  Stethoscope,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Smart Calculations for Better Pediatric Care
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl">
                    Streamline your practice with our comprehensive calculator
                    suite and patient management tools designed specifically for
                    pediatricians.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-700 disabled:pointer-events-none disabled:opacity-50"
                    href="#"
                  >
                    Get Started
                  </Link>
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-8 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
                    href="#"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <Image
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:aspect-square"
                height="550"
                src="/placeholder.svg"
                width="550"
              />
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32" id="features">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm">
                  Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything You Need
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Comprehensive tools designed to make your pediatric practice
                  more efficient and accurate.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-7xl items-center gap-6 py-12 lg:grid-cols-3">
              <Card>
                <CardContent className="flex flex-col items-center space-y-4 p-6">
                  <Calculator className="h-12 w-12 text-blue-600" />
                  <h3 className="text-xl font-bold">Medical Calculators</h3>
                  <p className="text-sm text-gray-500 text-center">
                    Quick access to essential pediatric calculations including
                    dosing, BMI, and growth percentiles.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center space-y-4 p-6">
                  <Users className="h-12 w-12 text-blue-600" />
                  <h3 className="text-xl font-bold">Patient Management</h3>
                  <p className="text-sm text-gray-500 text-center">
                    Efficiently manage patient records, appointments, and
                    follow-ups in one place.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center space-y-4 p-6">
                  <LineChart className="h-12 w-12 text-blue-600" />
                  <h3 className="text-xl font-bold">Growth Charts</h3>
                  <p className="text-sm text-gray-500 text-center">
                    Interactive growth charts with automatic plotting and trend
                    analysis.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="grid gap-10 md:gap-16 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-blue-600 px-3 py-1 text-sm text-white">
                  Benefits
                </div>
                <h2 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Why Choose PediCalc Pro?
                </h2>
                <ul className="grid gap-6">
                  <li className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-blue-600" />
                    <span>
                      Save time with quick calculations and automated tools
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <ClipboardList className="h-6 w-6 text-blue-600" />
                    <span>
                      Reduce errors with validated calculation methods
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Layout className="h-6 w-6 text-blue-600" />
                    <span>
                      Intuitive interface designed for busy clinicians
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <ChartBar className="h-6 w-6 text-blue-600" />
                    <span>Comprehensive analytics and reporting</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col items-start space-y-4">
                <Image
                  alt="App screenshot"
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center"
                  height="310"
                  src="/placeholder.svg"
                  width="550"
                />
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32" id="testimonials">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Trusted by Pediatricians
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Here's what healthcare professionals are saying about PediCalc
                  Pro
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-7xl items-center gap-6 py-12 lg:grid-cols-2">
              <Card>
                <CardContent className="flex flex-col space-y-4 p-6">
                  <p className="text-gray-500">
                    "This tool has revolutionized how I handle calculations in
                    my practice. It's accurate, fast, and incredibly
                    user-friendly."
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-gray-100 p-2">
                      <HeartPulse className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Dr. Sarah Johnson</h3>
                      <p className="text-sm text-gray-500">
                        Pediatrician, Children's Medical Center
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col space-y-4 p-6">
                  <p className="text-gray-500">
                    "The patient management features combined with the
                    calculation tools make this an essential part of my daily
                    practice."
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-gray-100 p-2">
                      <HeartPulse className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Dr. Michael Chen</h3>
                      <p className="text-sm text-gray-500">
                        Pediatric Specialist, City Hospital
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <section
          className="w-full py-12 md:py-24 lg:py-32 bg-blue-600"
          id="pricing"
        >
          <div>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-5xl">
                  Ready to Get Started?
                </h2>
                <p className="max-w-[600px] text-blue-100 md:text-xl">
                  Choose the plan that's right for your practice
                </p>
              </div>
              <div className="grid w-full max-w-sm items-start gap-8">
                <Card>
                  <CardContent className="flex flex-col items-center space-y-4 p-6">
                    <h3 className="text-xl font-bold">Pro Plan</h3>
                    <div className="text-4xl font-bold">$49/mo</div>
                    <ul className="space-y-2 text-sm text-gray-500">
                      <li>Unlimited calculations</li>
                      <li>Patient management tools</li>
                      <li>Growth chart tracking</li>
                      <li>Priority support</li>
                    </ul>
                    <Button className="w-full bg-blue-600">
                      Start Free Trial
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
