"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { krishnaNames } from "@/lib/constants/krishna-names";

interface PasswordCheckProps {
  onSuccess: () => void;
}

export function PasswordCheck({ onSuccess }: PasswordCheckProps) {
  const [password, setPassword] = useState("");
  const [placeholderText, setPlaceholderText] = useState("");
  const [nameIndex, setNameIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const currentName = krishnaNames[nameIndex];
    
    const typewriterTimeout = setTimeout(() => {
      if (charIndex < currentName.length) {
        setPlaceholderText(`Could be 🪄✨ ${currentName.slice(0, charIndex + 1)}`);
        setCharIndex(charIndex + 1);
      } else {
        // Wait a bit longer at the end of each name
        setTimeout(() => {
          setCharIndex(0);
          setNameIndex((prev) => (prev + 1) % krishnaNames.length);
          setPlaceholderText("Could be 🪄✨");
        }, 1500);
      }
    }, 100);

    return () => clearTimeout(typewriterTimeout);
  }, [nameIndex, charIndex]);

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
            placeholder={placeholderText || "Enter password"}
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
