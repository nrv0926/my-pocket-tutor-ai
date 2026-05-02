import Hero from "@/components/landing/Hero";
import Modes from "@/components/landing/Modes";
import Problem from "@/components/landing/Problem";
import HowItWorks from "@/components/landing/HowItWorks";
import Outputs from "@/components/landing/Outputs";
import WorksheetShowcase from "@/components/landing/WorksheetShowcase";
import Features from "@/components/landing/Features";
import Pricing from "@/components/landing/Pricing";
import Trust from "@/components/landing/Trust";
import Faq from "@/components/landing/Faq";
import Testimonial from "@/components/landing/Testimonial";
import Cta from "@/components/landing/Cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Modes />
      <Problem />
      <HowItWorks />
      <Outputs />
      <WorksheetShowcase />
      <Features />
      <Pricing />
      <Trust />
      <Faq />
      <Testimonial />
      <Cta />
    </>
  );
}
