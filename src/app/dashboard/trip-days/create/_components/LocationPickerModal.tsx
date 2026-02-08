"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Check, Search } from "lucide-react";
import type { ComboboxOption } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

type LocationPickerModalProps = {
    options: ComboboxOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    triggerLabel: string;
};

export function LocationPickerModal({
    options,
    value,
    onChange,
    placeholder = "Select a location",
    searchPlaceholder = "Search locations...",
    emptyText = "No location found.",
    triggerLabel,
}: LocationPickerModalProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    const filteredOptions = React.useMemo(() =>
        options.filter((option) =>
            option.label.toLowerCase().includes(searchValue.toLowerCase())
        ),
        [options, searchValue]
    );

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchValue("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal text-left h-auto min-h-10">
                    {triggerLabel || placeholder}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{placeholder}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="pl-8"
                            autoFocus
                        />
                    </div>
                    <ScrollArea className="h-64 border rounded-md">
                        <div className="flex flex-col gap-1 p-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <Button
                                        key={option.value}
                                        variant="ghost"
                                        className="w-full justify-start"
                                        onClick={() => handleSelect(option.value)}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                                        {option.label}
                                    </Button>
                                ))
                            ) : (
                                <p className="p-4 text-center text-sm text-muted-foreground">{emptyText}</p>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
