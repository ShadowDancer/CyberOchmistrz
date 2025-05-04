import Image from "next/image";
import Link from "next/link";
import logo from "./logo.jpg";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image 
            src={logo} 
            alt="Cyber Ochmistrz Logo"
            className="rounded-lg shadow-md w-1/4 h-1/4" 
        />
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Cyber Ochmistrz</h1>
        </div>
        <p className="text-lg text-center sm:text-left max-w-2xl">
          Przybornik drugiego oficera, który pomaga w przygotowaniu zaopatrzenia na rejsach. Zarządzaj przepisami, planuj posiłki i generuj listy zakupów.
        </p>

        <div className="flex flex-row gap-4 items-center justify-center w-full">
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            href="/przepisy"
          >
            Przejdź do przepisów
          </Link>
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-green-600 text-white gap-2 hover:bg-green-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            href="/rejsy"
          >
            Zarządzaj rejsami
          </Link>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            href="https://github.com/your-username/cyber-ochmistrz"
            target="_blank"
            rel="noopener noreferrer"
          >
            Dokumentacja
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <p className="text-sm text-gray-500">
          © 2025 Przemysław Onak
        </p>
      </footer>
    </div>
  );
}
