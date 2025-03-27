import MainLayout from "@/components/layouts/MainLayout";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import CourseSection from "@/components/sections/CourseSection";
import VideoSection from "@/components/sections/VideoSection";
import MentalHealthTools from "@/components/sections/MentalHealthTools";
import AIChatSection from "@/components/sections/AIChatSection";
import CheatSheets from "@/components/sections/CheatSheets";
import Testimonials from "@/components/sections/Testimonials";
import CTASection from "@/components/sections/CTASection";
import { useEffect } from "react";

const Home = () => {
  // Initialize theme preference from local storage
  useEffect(() => {
    const darkMode = localStorage.getItem("darkMode");
    if (darkMode === "true") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <MainLayout>
      <Hero />
      <Features />
      <CourseSection />
      <VideoSection />
      <MentalHealthTools />
      <AIChatSection />
      <CheatSheets />
      <Testimonials />
      <CTASection />
    </MainLayout>
  );
};

export default Home;
