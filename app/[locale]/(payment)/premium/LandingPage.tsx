"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Calendar, CheckCircle, BarChartIcon as ChartBar, ClipboardList, Clock, Users } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LandingPage() {
  const [pricingPeriod, setPricingPeriod] = useState<"monthly" | "annually">("monthly")
  return (
    <main className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-medical-50 to-white">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="inline-block rounded-lg bg-medical-100 px-3 py-1 text-sm text-medical-700">
                Designed for Pediatricians
              </div>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-heading text-medical-900">
                Streamline Your Pediatric Practice
              </h1>
              <p className="max-w-[600px] text-gray-600 md:text-xl">
                Comprehensive patient management, appointment scheduling, and growth tracking in one intuitive platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="bg-medical-500 hover:bg-medical-600">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="border-medical-200 text-medical-700 hover:bg-medical-50">
                  Book a Demo
                </Button>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="mr-1 h-4 w-4 text-medical-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-1 h-4 w-4 text-medical-500" />
                  <span>14-day free trial</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-[500px] aspect-video rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/placeholder.svg?height=500&width=800"
                  alt="Dashboard preview"
                  width={800}
                  height={500}
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-medical-500/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="w-full py-12 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-block rounded-lg bg-medical-100 px-3 py-1 text-sm text-medical-700">
              Features
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-heading text-medical-900">
              Everything You Need to Run Your Practice
            </h2>
            <p className="max-w-[700px] text-gray-600 md:text-xl">
              Our platform is designed specifically for pediatricians, with tools to manage patients,
              track growth, and streamline your workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <FeatureCard
              icon={<Users className="h-10 w-10 text-medical-500" />}
              title="Patient Management"
              description="Easily add patients, view medical history, and maintain comprehensive records in one place."
            />
            <FeatureCard
              icon={<Calendar className="h-10 w-10 text-medical-500" />}
              title="Appointment Scheduling"
              description="Intuitive calendar interface for managing appointments and reducing no-shows."
            />
            <FeatureCard
              icon={<ChartBar className="h-10 w-10 text-medical-500" />}
              title="Growth Charts"
              description="Track and visualize child development with customizable growth charts and percentiles."
            />
            <FeatureCard
              icon={<Clock className="h-10 w-10 text-medical-500" />}
              title="Custom Availability"
              description="Set your regular schedule and exceptions to manage your time effectively."
            />
            <FeatureCard
              icon={<ClipboardList className="h-10 w-10 text-medical-500" />}
              title="Medical Calculations"
              description="Quickly perform common pediatric calculations and save results to patient records."
            />
            <FeatureCard
              icon={<ChartBar className="h-10 w-10 text-medical-500" />}
              title="Analytics Dashboard"
              description="Get insights into your practice with comprehensive statistics and reports."
            />
          </div>
        </div>
      </section>
      {/* Benefits Section */}
      <section className="w-full py-12 md:py-24 bg-medical-50">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex items-center justify-center order-2 lg:order-1">
              <div className="relative w-full max-w-[500px] aspect-square">
                <div className="absolute top-0 left-0 w-3/4 h-3/4 bg-medical-pink-100 rounded-2xl"></div>
                <div className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-medical-200 rounded-2xl"></div>
                <div className="absolute inset-0 m-auto w-4/5 h-4/5 bg-white rounded-2xl shadow-xl overflow-hidden">
                  <Image
                    src="/placeholder.svg?height=400&width=400"
                    alt="Doctor using application"
                    width={400}
                    height={400}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-4 order-1 lg:order-2">
              <div className="inline-block rounded-lg bg-medical-100 px-3 py-1 text-sm text-medical-700">
                Benefits
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-heading text-medical-900">
                Why Pediatricians Choose Us
              </h2>
              <div className="space-y-4">
                <BenefitItem
                  title="Save 10+ Hours Per Week"
                  description="Automate routine tasks and spend more time with your patients."
                />
                <BenefitItem
                  title="Reduce Administrative Errors"
                  description="Our system helps prevent scheduling conflicts and record-keeping mistakes."
                />
                <BenefitItem
                  title="Improve Patient Experience"
                  description="Provide better care with comprehensive health tracking and timely appointments."
                />
                <BenefitItem
                  title="HIPAA Compliant"
                  description="Your patients' data is secure with our HIPAA-compliant platform."
                />
              </div>
              <Button className="w-fit bg-medical-500 hover:bg-medical-600">
                Learn More <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Pricing Section */}
      <section className="w-full py-12 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-block rounded-lg bg-medical-100 px-3 py-1 text-sm text-medical-700">
              Pricing
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-heading text-medical-900">
              Simple, Transparent Pricing
            </h2>
            <p className="max-w-[700px] text-gray-600 md:text-xl">
              Choose the plan that works best for your practice. No hidden fees.
            </p>
            <Tabs defaultValue="monthly" className="w-full max-w-md mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="monthly"
                  onClick={() => setPricingPeriod("monthly")}
                  className="data-[state=active]:bg-medical-500 data-[state=active]:text-white"
                >
                  Monthly
                </TabsTrigger>
                <TabsTrigger
                  value="annually"
                  onClick={() => setPricingPeriod("annually")}
                  className="data-[state=active]:bg-medical-500 data-[state=active]:text-white"
                >
                  Annually <span className="ml-1.5 text-xs font-normal text-medical-pink-500">Save 17%</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 mx-auto">
            <PricingCard
              title="Starter"
              price={pricingPeriod === "monthly" ? "$10" : "$100"}
              period={pricingPeriod === "monthly" ? "/month" : "/year"}
              description="Perfect for individual pediatricians or small practices."
              features={[
                "Up to 500 patient records",
                "Basic appointment scheduling",
                "Standard growth charts",
                "Email support",
                "HIPAA compliant storage"
              ]}
              buttonText="Get Started"
              buttonVariant="outline"
            />
            <PricingCard
              title="Professional"
              price={pricingPeriod === "monthly" ? "$25" : "$250"}
              period={pricingPeriod === "monthly" ? "/month" : "/year"}
              description="Ideal for growing practices with multiple doctors."
              features={[
                "Unlimited patient records",
                "Advanced scheduling system",
                "Custom growth charts",
                "Priority email & phone support",
                "Patient portal access",
                "Custom branding"
              ]}
              buttonText="Get Started"
              buttonVariant="default"
              highlighted={true}
            />
            <PricingCard
              title="Enterprise"
              price="Custom"
              period=""
              description="For large practices with specialized needs."
              features={[
                "Everything in Professional",
                "Custom integrations",
                "Dedicated account manager",
                "Staff training sessions",
                "Advanced analytics",
                "Multi-location support"
              ]}
              buttonText="Contact Sales"
              buttonVariant="outline"
            />
          </div>
        </div>
      </section>
      {/* Testimonials Section */}
      <section className="w-full py-12 md:py-24 bg-medical-50">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="inline-block rounded-lg bg-medical-100 px-3 py-1 text-sm text-medical-700">
              Testimonials
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-heading text-medical-900">
              Trusted by Pediatricians
            </h2>
            <p className="max-w-[700px] text-gray-600 md:text-xl">
              See what other healthcare professionals are saying about our platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            <TestimonialCard
              quote="This system has completely transformed how I manage my practice. I save hours each week on administrative tasks."
              name="Dr. Sarah Johnson"
              title="Pediatrician, Johnson Family Practice"
              imageSrc="/placeholder.svg?height=100&width=100"
            />
            <TestimonialCard
              quote="The growth charts and medical calculations are incredibly accurate and save me so much time. My patients love the visual reports."
              name="Dr. Michael Chen"
              title="Pediatric Specialist, Children's Medical Center"
              imageSrc="/placeholder.svg?height=100&width=100"
            />
            <TestimonialCard
              quote="The scheduling system alone is worth the investment. No more double bookings or missed appointments!"
              name="Dr. Emily Rodriguez"
              title="Pediatrician, Healthy Kids Clinic"
              imageSrc="/placeholder.svg?height=100&width=100"
            />
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 bg-medical-700">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="flex flex-col items-center justify-center space-y-4 text-center text-white">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-heading">
              Ready to Transform Your Practice?
            </h2>
            <p className="max-w-[700px] text-medical-100 md:text-xl">
              Join thousands of pediatricians who are saving time, reducing errors, and improving patient care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button size="lg" className="bg-white text-medical-700 hover:bg-medical-50">
                Start Your Free Trial
              </Button>
              <Button size="lg" variant="outline" className="border-medical-300 text-white hover:bg-medical-600">
                Schedule a Demo
              </Button>
            </div>
            <p className="text-medical-200 text-sm mt-4">
              No credit card required. 14-day free trial.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border-medical-100 hover:border-medical-300 transition-all duration-300 hover:shadow-md">
      <CardHeader>
        <div className="p-2 w-fit rounded-lg bg-medical-50">{icon}</div>
        <CardTitle className="mt-4 text-xl font-heading text-medical-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  )
}

function BenefitItem({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex items-start">
      <div className="mr-4 mt-1">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-medical-500 text-white">
          <CheckCircle className="h-4 w-4" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-medical-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  )
}

function PricingCard({
  title,
  price,
  period,
  description,
  features,
  buttonText,
  buttonVariant = "default",
  highlighted = false
}: {
  title: string
  price: string
  period: string
  description: string
  features: string[]
  buttonText: string
  buttonVariant?: "default" | "outline"
  highlighted?: boolean
}) {
  return (
    <Card className={`border-medical-100 ${highlighted ? 'ring-2 ring-medical-500 shadow-lg' : ''}`}>
      <CardHeader className="relative">
        {highlighted && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-medical-500 text-white text-xs font-medium px-3 py-1 rounded-full">
            Most Popular
          </div>
        )}
        <CardTitle className="text-xl font-heading text-medical-900">{title}</CardTitle>
        <div className="mt-2 flex items-baseline">
          <span className="text-4xl font-bold text-medical-900">{price}</span>
          <span className="ml-1 text-gray-600">{period}</span>
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-medical-500 mr-2 shrink-0 mt-0.5" />
              <span className="text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className={`w-full ${buttonVariant === "default" ? "bg-medical-500 hover:bg-medical-600" : "border-medical-300 text-medical-700 hover:bg-medical-50"}`}
          variant={buttonVariant}
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  )
}

function TestimonialCard({ quote, name, title, imageSrc }: { quote: string, name: string, title: string, imageSrc: string }) {
  return (
    <Card className="border-medical-100 hover:border-medical-300 transition-all duration-300 hover:shadow-md">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative w-16 h-16 rounded-full overflow-hidden mb-4">
            <Image
              src={imageSrc || "/placeholder.svg"}
              alt={name}
              fill
              className="object-cover"
            />
          </div>
          <p className="text-gray-600 italic mb-4">"{quote}"</p>
          <h3 className="font-semibold text-medical-900">{name}</h3>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </CardContent>
    </Card>
  )
}