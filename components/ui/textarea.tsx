import { TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextInputProps & { className?: string }) {
  return (
    <TextInput
      multiline
      textAlignVertical="top"
      placeholderTextColor="#5e5a53"
      className={cn(
        "min-h-[96px] border border-input bg-card px-3 py-2 text-base text-foreground",
        className,
      )}
      {...props}
    />
  );
}
