import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-50">
      <div className="w-full max-w-lg bg-white p-10 rounded-lg shadow-2xl">
        <h1 className="text-4xl font-semibold text-center text-teal-700 mb-6">
          Speech to Text Application
        </h1>
        <p className="text-center text-teal-800 text-lg mb-8">
          Effortlessly convert your speech to text with our advanced speech recognition software.
        </p>

        <div className="flex flex-col space-y-5">
          <Link href="/login">
            <button
              className="w-full py-3 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
              Log In
            </button>
          </Link>

          <Link href="/signup">
            <button
              className="w-full py-3 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              Create New Account
            </button>
          </Link>
        </div>
        
      </div>
    </div>
  );
}
