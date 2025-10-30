import { useState, ChangeEvent } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "./file-upload";
import { Wallet } from "lucide-react";

const assetStatusOptions = ["Pendente", "Em Análise", "Aprovado", "Rejeitado"] as const;

const formSchema = z.object({
  name: z.string().min(3, "Informe o nome do ativo."),
  tokenCode: z
    .string()
    .min(3, "Informe o código do token.")
    .max(15, "O código pode ter no máximo 15 caracteres."),
  status: z.enum(assetStatusOptions, {
    errorMap: () => ({ message: "Selecione um status válido." }),
  }),
  location: z.string().max(120, "Máximo de 120 caracteres.").optional(),
  valuation: z.string().optional(),
  yieldRate: z.string().optional(),
  description: z.string().max(500, "Máximo de 500 caracteres.").optional(),
  documentRequirements: z.string().max(500, "Máximo de 500 caracteres.").optional(),
});

export type RwaFormValues = z.infer<typeof formSchema>;

const formDefaultValues: Omit<RwaFormValues, "ownerWallet"> = {
  name: "",
  tokenCode: "",
  status: "Pendente",
  location: "",
  valuation: "",
  yieldRate: "",
  description: "",
  documentRequirements: "",
};

interface RwaCreateAssetFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: RwaFormValues, file: File | null) => Promise<boolean>;
  isSubmitting: boolean;
  ownerWallet: string | null;
}

export const RwaCreateAssetForm = ({
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting,
  ownerWallet,
}: RwaCreateAssetFormProps) => {
  const [formStep, setFormStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<RwaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: formDefaultValues,
  });

  const handleDialogChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setTimeout(() => {
        form.reset(formDefaultValues);
        setSelectedFile(null);
        setFormStep(1);
      }, 150);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleNextStep = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const fieldsToValidate: (keyof RwaFormValues)[] = ["name", "tokenCode", "status"];
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setFormStep(2);
    } else {
      toast.error("Por favor, corrija os erros no formulário antes de prosseguir.");
    }
  };

  const handleFormSubmit = async (values: RwaFormValues) => {
    const success = await onSubmit(values, selectedFile);
    if (success) {
      handleDialogChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo ativo RWA</DialogTitle>
          <DialogDescription>
            {formStep === 1
              ? "Cadastre as informações iniciais para iniciar a validação do ativo real."
              : "Anexe um documento comprobatório. Este passo é opcional."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {formStep === 1 && (
              <ScrollArea className="max-h-[70vh] pr-6 -mr-6">
                <div className="space-y-6 pr-2">
                  <div className="space-y-2">
                    <Label>Carteira Responsável</Label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={ownerWallet ?? "Conecte sua carteira para continuar"}
                        disabled
                        className="pl-10 bg-muted/40"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do ativo</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Fazenda São João"
                              className="bg-background/60"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tokenCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código do token</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="AGR-001"
                              className="bg-background/60 uppercase"
                              {...field}
                              onChange={(event) =>
                                field.onChange(event.target.value.toUpperCase())
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status inicial</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background/60">
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {assetStatusOptions.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status === "Em Análise" ? "Em análise" : status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Localização</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Município / Estado"
                              className="bg-background/60"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="valuation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valuation estimado (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="500.000,00"
                              className="bg-background/60"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="yieldRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yield esperado (% a.a.)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="8,50"
                              className="bg-background/60"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Resumo do ativo, propósito da tokenização e outras observações."
                            className="bg-background/60 min-h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </ScrollArea>
            )}

            {formStep === 2 && (
              <div className="space-y-4 py-8">
                <FileUpload
                  id="document-upload-create"
                  label="Anexar documento (Pode ser enviado depois)"
                  selectedFile={selectedFile}
                  onFileChange={handleFileChange}
                  onFileClear={() => setSelectedFile(null)}
                  disabled={isSubmitting}
                />
              </div>
            )}

            <DialogFooter className="pt-6 border-t border-border">
              {formStep === 1 ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleDialogChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="hero"
                    onClick={handleNextStep}
                    disabled={!ownerWallet}
                  >
                    Avançar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setFormStep(1)}
                    disabled={isSubmitting}
                  >
                    Voltar
                  </Button>
                  <Button type="submit" variant="hero" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : "Cadastrar ativo"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};