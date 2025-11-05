"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link, useLocation } from "react-router"
import { LucideIcon, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function Navbar({ items, className }: NavBarProps) {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(items[0].name)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const currentItem = items.find(item => item.url === location.pathname)
    if (currentItem) {
      setActiveTab(currentItem.name)
      setIsMobileMenuOpen(false)
    }
  }, [location.pathname, items])

  return (
    <>
      {/* Desktop Navbar */}
      <div
        className={cn(
          "hidden md:flex fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-6 sm:pt-6",
          className,
        )}
      >
        <div className="flex items-center gap-3 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.name

            return (
              <Link
                key={item.name}
                to={item.url}
                className={cn(
                  "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                  "text-foreground/80 hover:text-primary",
                  isActive && "bg-muted text-primary",
                )}
              >
                <span className="hidden md:inline">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="lamp"
                    className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                      <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                      <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                      <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                    </div>
                  </motion.div>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Mobile Navbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 border-b border-border backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-lg font-bold">Eventure</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="relative z-50"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-border bg-background/50 backdrop-blur-sm"
            >
              <div className="flex flex-col gap-2 p-4">
                {items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.name

                  return (
                    <Link
                      key={item.name}
                      to={item.url}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                        "text-foreground/80 hover:text-primary hover:bg-muted",
                        isActive && "bg-muted text-primary font-semibold",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile spacer */}
      <div className="md:hidden h-16" />
    </>
  )
}
