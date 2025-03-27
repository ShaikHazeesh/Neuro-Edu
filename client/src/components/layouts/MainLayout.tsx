import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="font-opensans text-textColor bg-background dark:bg-darkBg dark:text-darkText transition-colors duration-300">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;
