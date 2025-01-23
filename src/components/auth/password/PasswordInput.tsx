import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { PasswordFormValues } from "./types";

interface PasswordInputProps {
  form: UseFormReturn<PasswordFormValues>;
  name: keyof PasswordFormValues;
  label: string;
  disabled?: boolean;
}

export const PasswordInput = ({ form, name, label, disabled }: PasswordInputProps) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-dashboard-text">{label}</FormLabel>
          <FormControl>
            <Input 
              {...field} 
              type="password"
              disabled={disabled}
              className="bg-dashboard-dark border-dashboard-cardBorder text-dashboard-text focus:border-dashboard-accent1" 
            />
          </FormControl>
          <FormMessage className="text-red-500" />
        </FormItem>
      )}
    />
  );
};