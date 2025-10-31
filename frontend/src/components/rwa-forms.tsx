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

// NOTE: These values correspond to the database enum and should not be translated.
const assetStatusOptions = ["Pendente", "Em Análise", "Aprovado", "Rejeitado"] as const;

// Helper function to translate status for display
const translateStatus = (status: string): string => {
  switch (status) {
    case "Pendente":
      return "Pending";
    case "Em Análise":
      return "In Review";
    case "Aprovado":
      return "Approved";
    case "Rejeitado":
      return "Rejected";
    default:
      return status;
  }
};

const formSchema = z.object({
  name: z.string().min(3, "Please provide the asset name."),
  tokenCode: z
    .string()
    .min(3, "Please provide the token code.")
    .max(15, "The code can have a maximum of 15 characters."),
  status: z.enum(assetStatusOptions, {
    errorMap: () => ({ message: "Please select a valid status." }),
  }),
  location: z.string().max(120, "Maximum 120 characters.").optional(),
  valuation: z.string().optional(), // Using string for flexible input
  yieldRate: z.string().optional(), // Using string for flexible input
  description: z.string().max(500, "Maximum 500 characters.").optional(),
  documentRequirements: z.string().max(500, "Maximum 500 characters.").optional(),
});

export type RwaFormValues = z.infer<typeof formSchema>;

const formDefaultValues: Omit<RwaFormValues, "ownerWallet"> = {
  name: "",
  tokenCode: "",
  status: "Pendente", // Default enum value
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
      toast.error("Please fix the errors in the form before proceeding.");
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
          <DialogTitle>New RWA Asset</DialogTitle>
          <DialogDescription>
            {formStep === 1
              ? "Register the initial information to start the real asset validation."
              : "Attach a supporting document. This step is optional."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {formStep === 1 && (
              <ScrollArea className="max-h-[70vh] pr-6 -mr-6">
                <div className="space-y-6 pr-2">
                  <div className="space-y-2">
                    <Label>Responsible Wallet</Label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={ownerWallet ?? "Connect your wallet to continue"}
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
                          <FormLabel>Asset Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="St. John's Farm"
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
                          <FormLabel>Token Code</FormLabel>
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
                          <FormLabel>Initial Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background/60">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {assetStatusOptions.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {translateStatus(status)}
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
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="City / State"
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
                          <FormLabel>Estimated Valuation ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="500,000.00"
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
                          <FormLabel>Expected Yield (% p.a.)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="8.50"
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Summary of the asset, purpose of tokenization, and other observations."
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
                  label="Attach document (Can be sent later)"
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
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="hero"
                    onClick={handleNextStep}
                    disabled={!ownerWallet}
                  >
                    Next
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
                    Back
                  </Button>
                  <Button type="submit" variant="hero" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Register Asset"}
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