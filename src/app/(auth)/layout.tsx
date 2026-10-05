export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col justify-center bg-stone-100 px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-stone-900">
            Kasbon
          </h1>
          <p className="mt-2 text-stone-600">
            Catat utang-piutang, biar nggak ada yang kelupaan.
          </p>
        </header>
        {children}
      </div>
    </main>
  );
}
