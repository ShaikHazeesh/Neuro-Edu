import MainLayout from "@/components/layouts/MainLayout";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import CTASection from "@/components/sections/CTASection";
import Testimonials from "@/components/sections/Testimonials";

const Home = () => {
  return (
    <MainLayout>
      <Hero />
      <Features />
      <Testimonials />
      <CTASection />
    </MainLayout>
  );
};

export default Home;
