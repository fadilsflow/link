// import { Briefcase, Sparkles, Users, Zap } from 'lucide-react'
// import { Button } from './ui/button'

// export function HeroSection() {
//   return (
//     <section className="relative flex min-h-screen flex-col items-center justify-center px-4 py-24 text-center sm:py-32">
//       {/* Badge */}
//       <div className="mb-8 inline-flex items-center">
//         <span className="rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase leading-tight tracking-wide text-white shadow-sm">
//           Platform Bisnis
//         </span>
//         <span className="ml-2.5 text-xs font-bold tracking-wide text-emerald-600 uppercase">
//           Praktis & siap jualan
//         </span>
//       </div>

//       {/* Main Heading */}
//       <h1 className="max-w-4xl font-heading text-4xl font-bold tracking-tight text-primary sm:text-6xl md:text-7xl leading-[1.1]">
//         Platform Bisnis Online Praktis{' '}
//         <span className="block sm:inline">untuk Semua Produk</span>
//       </h1>

//       {/* Subheading with Icons */}
//       <div className="mt-8 max-w-3xl text-lg text-muted-foreground sm:text-xl leading-relaxed font-light">
//         <p>
//           Mulai bisnis online dengan{' '}
//           <span className="font-heading text-foreground">cepat</span>,{' '}
//           <span className="inline-flex items-center justify-center align-middle mx-1">
//             <span className="flex items-center justify-center w-6 h-6 rounded bg-emerald-500 text-white shadow-sm transform rotate-2">
//               <Zap size={14} />
//             </span>
//           </span>{' '}
//           <span className="font-heading text-foreground">mudah</span>, dan bisa
//           dijalankan tanpa{' '}
//           <span className="inline-flex items-center justify-center align-middle mx-1">
//             <span className="flex items-center justify-center w-6 h-6 rounded bg-indigo-500 text-white shadow-sm transform -rotate-2">
//               <Users size={14} />
//             </span>
//           </span>{' '}
//           tim teknis.{' '}
//           <span className="inline-flex items-center justify-center align-middle mx-1">
//             <span className="flex items-center justify-center w-6 h-6 rounded bg-black text-white shadow-sm transform -rotate-3">
//               <Briefcase size={14} />
//             </span>
//           </span>{' '}
//           Tulis nama bisnismu, halaman langsung aktif dan siap menerima order
//           sebagai satu{' '}
//           <span className="inline-flex items-center justify-center align-middle mx-1">
//             <span className="flex items-center justify-center w-7 h-7 text-amber-400 drop-shadow-sm">
//               <Sparkles size={24} fill="currentColor" />
//             </span>
//           </span>{' '}
//           <span className="font-heading text-foreground">
//             pusat penjualan online
//           </span>
//           .
//         </p>
//       </div>

//       {/* Buttons */}
//       <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
//         <Button
//           size="lg"
//           className="h-12 px-8 text-base font-medium min-w-[200px] shadow-lg hover:shadow-xl transition-all"
//         >
//           Buat Halaman Bisnis
//         </Button>
//         <Button
//           variant="outline"
//           size="lg"
//           className="h-12 px-8 text-base font-medium min-w-[200px] bg-white hover:bg-gray-50 transition-all border-gray-200"
//         >
//           Lihat Contoh Halaman
//         </Button>
//       </div>
//     </section>
//   )
// }
import { Button } from "./ui/button";
import { Link } from "@tanstack/react-router";

export default function HeroSection() {
  return (
    <section className="relative ">
      <div className=" pt-25 pb-5  ">
        <div className="">
          <div className="pb-20 lg:pb-1 z-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading tracking-tight">
              Monetize {" "}
              <span className="before:-inset-x-1 before:-rotate-1 relative z-4 before:pointer-events-none before:absolute before:inset-y-0 before:z-4 before:bg-linear-to-r before:from-blue-500 before:via-purple-500 before:to-orange-500 before:opacity-16 before:mix-blend-hard-light">
                Your Creativity
              </span>

            </h1>

            <p className="mt-4 max-w-2xl text-base sm:text-xl text-muted-foreground ">
              Turn your ideas into income with a single page.
            </p>

            <div className="mt-8 grid grid-cols-2 md:flex items-center gap-2 ">
              <Button
                size={"lg"}
                className=" text-sm  rounded-full lg:text-base  sm:w-auto hover:shadow-lg"
                render={<Link to="/" />}
              >
                <span className="text-nowrap">Get Started</span>{" "}
                <span className="border-l-primary-foreground/50 ml-0.5 block size-0 border-y-4 border-l-4 border-y-transparent" />
              </Button>

              {/* <div
                aria-hidden="true"
                className="mask-y-from-90% pointer-events-none absolute -inset-y-32 inset-x-[5px] border-x border-dashed lg:inset-x-[9px]"
              /> */}
            </div>
            {/* <div className="flex overflow-x-auto whitespace-nowrap items-center gap-2 mt-6 no-scrollbar">
              <TechLogo />
            </div> */}
          </div>
          {/* <DemoPorto /> */}
        </div>
      </div>
    </section>
  );
}
