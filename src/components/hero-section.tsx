import { Link } from '@tanstack/react-router'
import { Button } from './ui/button'

export default function HeroSection() {
  return (
    <section className="relative border-edge container ">
      <div className=" pt-25 pb-5">
        <div className="z-10  flex flex-col">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-heading tracking-tight">
            Kreasi kamu {" "}
            <span className="before:-inset-x-1 before:-rotate-1 relative z-4 before:pointer-events-none before:absolute before:inset-y-0 before:z-4 before:bg-linear-to-r before:from-blue-500 before:via-purple-500 before:to-orange-500 before:opacity-16 before:mix-blend-hard-light">
              berharga
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-xl sm:text-3xl text-foreground/80">
            Modern tools for modern Kreator.
          </p>

          <Button
            size={'lg'}
            className="text-sm sm:py-6 mt-8 -rotat-3 lg:text-base w-full w-fit hover:shadow-lg"
            render={<Link to="/login" />}
            variant={'neutral'}
          >
            <span className="text-nowrap">Gabung Jadi Kreator</span>{' '}
            <span className="border-l-primary-foreground/50 ml-0.5 block size-0 border-y-4 border-l-4 border-y-transparent" />
          </Button>
        </div>
        <div className="mask-b-from-55% relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
          <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-6xl overflow-hidden rounded-2xl border p-4 shadow-lg shadow-zinc-950/15 ring-1">
            <div
              className="z-2 border-border/25 aspect-15/8 relative rounded-2xl border bg-muted"
            />
            {/* <img
              className="z-2 border-border/25 aspect-15/8 relative rounded-2xl border"
              src="/hero.png"
              alt="app screen"
              width="2700"
              height="1440"
            /> */}
          </div>
        </div>
      </div>
    </section>
  )
}
