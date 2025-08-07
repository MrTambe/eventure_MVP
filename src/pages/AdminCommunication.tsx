import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { motion } from "framer-motion";
import EmojiPicker from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile, Send, MessageSquare, Users, Settings, FileText, Paperclip, Home, Calendar } from 'lucide-react';
import { BrutalistDock } from "@/components/ui/brutalist-dock";
import { MessageWithReadReceipt, Message } from "@/components/ui/MessageWithReadReceipt";
import { useNavigate } from "react-router";
import { useTheme } from "@/components/theme-provider";
import { Protected } from "@/lib/protected-page";

interface AdminUser {
  _id: Id<"users">;
  name?: string;
  email?: string;
  image?: string;
}

interface AttachmentPreview {
  name: string;
  url: string;
  type: string;
}

export default function AdminCommunication() {
  return <div />;
}