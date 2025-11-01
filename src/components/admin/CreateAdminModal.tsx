// @ts-nocheck
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES } from '@/convex/schema';
import { Plus, Loader2 } from 'lucide-react';

export function CreateAdminModal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>(ROLES.ADMIN);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createAdmin = useAction(api.admin_actions.createAdmin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !role) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Always normalize email for consistent uniqueness and lookups
      const normalizedEmail = email.trim().toLowerCase();
      const result = await createAdmin({ 
        email: normalizedEmail, 
        password, 
        role 
      });
      
      if (result?.success) {
        toast.success("New user created successfully!");
        setIsOpen(false);
        setEmail('');
        setPassword('');
        setRole(ROLES.ADMIN);
      } else {
        toast.error(result?.message || "Failed to create user");
      }
    } catch (error) {
      console.error("Create admin error:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred while creating the user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono text-lg px-8 py-4 border-2 border-black dark:border-white"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          CREATE NEW ADMIN
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-white dark:bg-black border-2 border-black dark:border-white font-mono">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">Register New Admin/TeamMember</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <Label htmlFor="email" className="text-sm font-bold mb-2 block">EMAIL ADDRESS</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-2 border-black dark:border-white font-mono text-base p-3"
              placeholder="Enter email address"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-sm font-bold mb-2 block">PASSWORD</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-2 border-black dark:border-white font-mono text-base p-3"
              placeholder="Enter password"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="role" className="text-sm font-bold mb-2 block">ROLE</Label>
            <Select onValueChange={setRole} defaultValue={role} disabled={isSubmitting}>
              <SelectTrigger className="w-full border-2 border-black dark:border-white font-mono text-base p-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Roles</SelectLabel>
                  <SelectItem value={ROLES.ADMIN}>Admin</SelectItem>
                  <SelectItem value={ROLES.USER}>TeamMember</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-mono text-base py-3 border-2 border-black dark:border-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  CREATING...
                </>
              ) : (
                'SAVE'
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)} 
              disabled={isSubmitting}
              className="flex-1 border-2 border-black dark:border-white font-mono text-base py-3 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              CANCEL
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}