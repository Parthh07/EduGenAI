import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from './context/AuthContext';
import { FileProvider } from './context/FileContext';
import NavBar from './components/NavBar';
import NavWrapper from './components/NavWrapper';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "EduGen AI",
  description: "Intelligent Study Material Generator — AI-powered study synthesis, exam simulation, and flashcard review.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased relative`}
        style={{ fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif" }}
      >
        <AuthProvider>
          <FileProvider>
            <NavBar />
            <NavWrapper>
              {children}
            </NavWrapper>
          </FileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
