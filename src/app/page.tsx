import Image from "next/image";
import Link from "next/link";
import logo from "./logo.jpg";
import githubLogo from "./github-invertocat.svg";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_auto] items-center justify-items-center min-h-screen p-4 md:p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-6 md:gap-8 row-start-2 items-center">
        <Image 
            src={logo} 
            alt="Cyber Ochmistrz Logo"
            className="rounded-lg shadow-md w-2/3 md:w-1/2 h-auto" 
        />
        <div className="flex items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Cyber Ochmistrz</h1>
        </div>
        <p className="text-base md:text-lg text-center max-w-2xl px-2">
          Przybornik drugiego oficera, który pomaga w przygotowaniu zaopatrzenia na rejsach. Zarządzaj przepisami, planuj posiłki i generuj listy zakupów.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-center justify-center w-full sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2">
          <Link
            className="rounded-full shadow-sm hover:shadow transition-all flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm md:text-base h-12 px-5 w-full"
            href="/przepisy"
          >
            Książka kucharska
          </Link>
          <Link
            className="rounded-full shadow-sm hover:shadow transition-all flex items-center justify-center bg-green-600 text-white gap-2 hover:bg-green-700 font-medium text-sm md:text-base h-12 px-5 w-full"
            href="/rejsy"
          >
            Rejsy
          </Link>
        </div>
      </main>
      <footer className="row-start-3 w-full py-4 flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-3">
        <a
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mx-auto sm:mx-0 sm:ml-6"
          href="https://github.com/ShadowDancer/CyberOchmistrz"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="bg-gray-800 rounded-full p-1.5 w-8 h-8 flex items-center justify-center">
            <Image 
              src={githubLogo} 
              alt="GitHub" 
              width={20} 
              height={20}
            />
          </div>
          <span className="text-sm font-medium">GitHub</span>
        </a>
        <p className="text-sm text-gray-500 mx-auto sm:mx-0 sm:mr-6">
          © 2025 Przemysław Onak
        </p>
      </footer>
    </div>
  );
}
