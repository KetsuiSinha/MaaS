"use client";
import { useForm, FormProvider } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AuthCardProps {
  mode: "login" | "signup";
  onSubmit: (data: { name?: string; email: string; password: string }) => void;
}

export function AuthCard({ mode, onSubmit }: AuthCardProps) {
  const form = useForm<{ name?: string; email: string; password: string }>({
    defaultValues: { name: "", email: "", password: "" },
  });

  const submitHandler = form.handleSubmit(onSubmit);

  return (
    <FormProvider {...form}>
      <form onSubmit={submitHandler} className="p-4 max-w-sm mx-auto flex flex-col gap-4">
        {mode === "signup" && (
          <FormField name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Your Name" />
              </FormControl>
            </FormItem>
          )} />
        )}

        <FormField name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input {...field} placeholder="you@example.com" />
            </FormControl>
          </FormItem>
        )} />

        <FormField name="password" render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <Input {...field} type="password" placeholder="********" />
            </FormControl>
          </FormItem>
        )} />

        <Button type="submit">{mode === "signup" ? "Sign Up" : "Sign In"}</Button>
      </form>
    </FormProvider>
  );
}
