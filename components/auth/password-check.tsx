"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface PasswordCheckProps {
  onSuccess: () => void;
}

export function PasswordCheck({ onSuccess }: PasswordCheckProps) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "harekrishna") {
      onSuccess();
      toast("Access granted!", {
        description: "Hare Krishna! 🙏",
      });
    } else {
      toast.error("Incorrect password", {
        description: "Please try again",
      });
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">🔒 Enter Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full">
            Unlock
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
