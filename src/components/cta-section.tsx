import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";

export default function CTASection() {
    return (
        <div className="container my-30 py-6 flex flex-col">
            <h3 className="text-6xl sm:text-7xl lg:text-8xl font-heading tracking-tight">Grow, connect, <br /> monetize your <br />audience.</h3>
            <Button
                size={'lg'}
                className="text-sm py-6 mt-8 w-fit"
                variant={'neutral'}
                render={<Link to="/login" />}
            >Mulai Sekarang!</Button>
        </div>
    )
}