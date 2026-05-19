import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans border border-amber-700 dark:bg-black">
      <div className=" mb-2">
        <h1 className=" text-2xl font-bold">Ingresa una url</h1>
      </div>
      <main className="w-2xl h-auto p-1.5 flex flex-row justify-center gap-8 items-center rounded-lg border border-b-blue-600">
        <div className=" flex bg-mist-200 grow-2 justify-center" ><p className="p-1">Ingresa una url</p></div>
        <div className="bg-red-300 px-9">
          <p className="p-1">Buscar</p>
        </div>
      </main>
    </div>
  );
}
