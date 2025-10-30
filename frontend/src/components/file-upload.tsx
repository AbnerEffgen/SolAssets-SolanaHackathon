import { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface FileUploadProps {
  id: string;
  selectedFile: File | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFileClear: () => void;
  disabled?: boolean;
  label: string;
  accept?: string;
  helpText?: string;
}

export const FileUpload = ({
  id,
  selectedFile,
  onFileChange,
  onFileClear,
  disabled = false,
  label,
  accept = "image/png, image/jpeg, application/pdf",
  helpText = "Permitido: PNG, JPG, PDF. Tamanho máximo: 15MB.",
}: FileUploadProps) => {
  return (
    <div className="space-y-4">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type="file"
          onChange={onFileChange}
          className="bg-background/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          accept={accept}
          disabled={disabled}
        />
      </div>
      {selectedFile && (
        <div className="flex items-center justify-between text-sm text-muted-foreground p-2 bg-background/50 rounded-md">
          <span>{selectedFile.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onFileClear}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  );
};