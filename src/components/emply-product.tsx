import { PackageIcon } from "lucide-react";

import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";

export default function EmptyProduct() {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <PackageIcon />
                </EmptyMedia>
                <EmptyTitle>No digital products yet</EmptyTitle>
                <EmptyDescription>Create a product to get started.</EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
