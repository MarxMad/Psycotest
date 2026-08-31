"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "admin-sidebar-collapsed";

export function useAdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setIsCollapsed(stored === "true");
    }
    setMounted(true);
  }, []);

  const toggle = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return { isCollapsed, toggle, mounted };
}
