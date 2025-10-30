import { ChangeEvent, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Upload, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div
        className={cn(
          "flex items-center justify-between gap-4 rounded-lg border border-input bg-transparent p-3 text-sm",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {selectedFile ? (
            <>
              <FileIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <span className="truncate font-medium">{selectedFile.name}</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Nenhum arquivo selecionado</span>
            </>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {selectedFile ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onFileClear}
              disabled={disabled}
              className="h-8"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remover
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleButtonClick}
              disabled={disabled}
              className="h-8"
            >
              <Upload className="mr-2 h-4 w-4" />
              Escolher
            </Button>
          )}
        </div>
      </div>
      <Input
        id={id}
        ref={inputRef}
        type="file"
        onChange={onFileChange}
        accept={accept}
        disabled={disabled}
        className="sr-only" // Oculta o input visualmente, mas o mantém funcional
      />
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  );
};