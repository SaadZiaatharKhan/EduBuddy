import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center bg-white h-screen w-screen">

      <h1 className="text-4xl font-bold text-blue-500">
        EduBuddy
      </h1>

      <div>
        <Link href="/auth"><button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Enter</button></Link>
      </div>
      
    </div>
  );
}
