import { Link } from '@tanstack/react-router'
import { Button } from './ui/button'

export default function HeroSection() {
  return (
    <section className="relative ">
      <div className=" pt-25 pb-5  ">
        <div className="">
          <div className="pb-20 lg:pb-1 z-10 text-center flex flex-col items-center justify-center">
            <h1 className="text-6xl sm:text-7xl lg:text-9xl font-heading tracking-tight">
              Kreasi kamu <br />
              <span className="before:-inset-x-1 before:-rotate-1 relative z-4 before:pointer-events-none before:absolute before:inset-y-0 before:z-4 before:bg-linear-to-r before:from-blue-500 before:via-purple-500 before:to-orange-500 before:opacity-16 before:mix-blend-hard-light">
                berharga.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-base sm:text-3xl text-muted-foreground">
              Ubah ide menjadi penghasilan dengan satu halaman.
            </p>


            <Button
              size={'lg'}
              className=" text-sm mt-8 rounded-full lg:text-base  sm:w-auto hover:shadow-lg"
              render={<Link to="/" />}
            >
              <span className="text-nowrap">Get Started</span>{' '}
              <span className="border-l-primary-foreground/50 ml-0.5 block size-0 border-y-4 border-l-4 border-y-transparent" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
