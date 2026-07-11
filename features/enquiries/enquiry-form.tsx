"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const emailAddressSchema = z.string().email();

function isEmailOrPhone(value: string) {
  if (emailAddressSchema.safeParse(value).success) return true;

  const digits = value.replace(/\D/g, "");
  return /^\+?[0-9\s().-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
}

const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  contact: z.string().trim().min(6, "Enter a phone number or email address.").refine(isEmailOrPhone, "Enter a valid phone number or email address."),
  interest: z.string().trim().min(3, "Tell us what kind of property or service you need."),
  message: z.string().trim().min(20, "Add a little more context so the consultation can be useful.").max(1000, "Keep the message under 1,000 characters."),
});

type EnquiryValues = z.infer<typeof enquirySchema>;

type EnquiryFormProps = {
  initialInterest?: string;
};

export function EnquiryForm({ initialInterest = "" }: EnquiryFormProps) {
  const [prepared, setPrepared] = useState<EnquiryValues | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<EnquiryValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { name: "", contact: "", interest: initialInterest, message: "" },
  });

  function prepareEnquiry(values: EnquiryValues) {
    setPrepared(values);
    reset();
  }

  return (
    <div className="enquiry-form-wrap">
      {prepared ? (
        <Alert className="enquiry-success">
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle>Your enquiry summary is ready.</AlertTitle>
          <AlertDescription>
            Thanks, {prepared.name}. This preview validates the consultation flow without transmitting personal data. Connect the approved CRM or email provider before production launch.
          </AlertDescription>
        </Alert>
      ) : null}
      <form className="enquiry-form" onSubmit={handleSubmit(prepareEnquiry)} noValidate>
        <div className="form-field">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" required {...register("name")} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />
          {errors.name ? <p id="name-error" className="field-error" role="alert">{errors.name.message}</p> : null}
        </div>
        <div className="form-field">
          <Label htmlFor="contact">Phone or email</Label>
          <Input id="contact" autoComplete="email" required {...register("contact")} aria-invalid={Boolean(errors.contact)} aria-describedby={errors.contact ? "contact-error" : undefined} />
          {errors.contact ? <p id="contact-error" className="field-error" role="alert">{errors.contact.message}</p> : null}
        </div>
        <div className="form-field form-field--wide">
          <Label htmlFor="interest">Property or service interest</Label>
          <Input id="interest" required {...register("interest")} defaultValue={initialInterest} placeholder="Residential, commercial, land, development…" aria-invalid={Boolean(errors.interest)} aria-describedby={errors.interest ? "interest-error" : undefined} />
          {errors.interest ? <p id="interest-error" className="field-error" role="alert">{errors.interest.message}</p> : null}
        </div>
        <div className="form-field form-field--wide">
          <Label htmlFor="message">What would make this conversation useful?</Label>
          <Textarea id="message" rows={6} required {...register("message")} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "message-error" : undefined} />
          {errors.message ? <p id="message-error" className="field-error" role="alert">{errors.message.message}</p> : null}
        </div>
        <div className="form-submit-row">
          <p>No personal data leaves this preview.</p>
          <Button className="brand-button" type="submit" disabled={isSubmitting}>Prepare enquiry</Button>
        </div>
      </form>
    </div>
  );
}
