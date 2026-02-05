import { PlusIcon } from "lucide-react"
import { Gmail } from "../icon/gmail"
import { LinkedIn } from "../icon/linkedin"
import { XformerlyTwitter } from "../icon/x"
import { Button } from "../ui/button"

export default function SocialEditor() {
    return (
        <div className="flex gap-4 pt-2">
            <Button size="icon" variant="secondary">
                <LinkedIn className="size-4" />
            </Button>
            <Button size="icon" variant="secondary">
                <XformerlyTwitter className="size-4 invert" />
            </Button>
            <Button size="icon" variant="secondary">
                <Gmail className="size-4" />
            </Button>
            <Button size="icon" variant="secondary">
                <PlusIcon size={16} />
            </Button>
        </div>
    )
}